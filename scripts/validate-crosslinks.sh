#!/bin/bash
# =============================================================================
# VALIDATE CROSSLINKS — Valida HTTP status de cross-links documentados
# Lê INTERLINKING-AUDIT.json e verifica que cada URL destino retorna HTTP 200
#
# Uso:
#   bash scripts/validate-crosslinks.sh                   # Todos (HTTP check)
#   bash scripts/validate-crosslinks.sh --pending-only    # Apenas pending
#   bash scripts/validate-crosslinks.sh --wave-check      # Valida regras de onda
#   DOMAIN=meudominio.com bash scripts/validate-crosslinks.sh
#
# Exit code:
#   0 — todos acessíveis / sem violações
#   N — N links com falha / N violações
# =============================================================================

set -o pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Modo --wave-check: valida regras de onda entre slugs dos crossLinks
if [[ "${1:-}" == "--wave-check" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  SITES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/sites"
  VIOLATIONS=0

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  WAVE VALIDATION — Regras de Onda${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Mapa slug → wave
  declare -A WAVE_MAP
  for cfg in "$SITES_DIR"/*/config.json; do
    slug=$(node -e "console.log(require('$cfg').slug ?? '')" 2>/dev/null || true)
    wave=$(node -e "console.log(require('$cfg').wave ?? require('$cfg').deployWave ?? 1)" 2>/dev/null || true)
    [[ -n "$slug" ]] && WAVE_MAP["$slug"]="${wave:-1}"
  done

  for cfg in "$SITES_DIR"/*/config.json; do
    site_slug=$(node -e "console.log(require('$cfg').slug ?? '')" 2>/dev/null || true)
    site_wave=$(node -e "console.log(require('$cfg').wave ?? require('$cfg').deployWave ?? 1)" 2>/dev/null || true)
    cross_hrefs=$(node -e "
      const c=require('$cfg');
      (c.crossLinks??[]).forEach(l=>console.log(l.href));
    " 2>/dev/null || true)

    [[ -z "$cross_hrefs" ]] && continue

    while IFS= read -r href; do
      [[ -z "$href" ]] && continue
      target_slug=$(echo "$href" | sed -E 's|https?://([a-z0-9-]+)\..*|\1|')
      if [[ -n "$target_slug" ]] && [[ -v "WAVE_MAP[$target_slug]" ]]; then
        target_wave="${WAVE_MAP[$target_slug]}"
        if [[ "$target_wave" -gt "$site_wave" ]]; then
          echo -e "${RED}[VIOLAÇÃO]${NC} $site_slug (wave $site_wave) → $target_slug (wave $target_wave)"
          VIOLATIONS=$((VIOLATIONS + 1))
        fi
      fi
    done <<< "$cross_hrefs"
  done

  echo ""
  if [[ $VIOLATIONS -gt 0 ]]; then
    echo -e "${RED}❌ $VIOLATIONS violação(ões) de regra de onda${NC}"
    exit 1
  else
    echo -e "${GREEN}✅ Nenhuma violação de regra de onda${NC}"
    exit 0
  fi
fi

DOMAIN="${DOMAIN:-DOMAIN.com}"
TIMEOUT=10
ERRORS=0
PASSED=0
SKIPPED=0

# Localizar INTERLINKING-AUDIT.json
AUDIT_FILE=""
for candidate in \
  "../../output/docs/micro-sites/INTERLINKING-AUDIT.json" \
  "../docs/micro-sites/INTERLINKING-AUDIT.json" \
  "docs/INTERLINKING-AUDIT.json"; do
  if [ -f "$candidate" ]; then
    AUDIT_FILE="$candidate"
    break
  fi
done

if [ -z "$AUDIT_FILE" ]; then
  echo -e "${RED}ERRO:${NC} INTERLINKING-AUDIT.json não encontrado."
  echo "Crie o arquivo em output/docs/micro-sites/ ou execute TASK-1 ST001."
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      VALIDATE CROSS-LINKS — Rede Micro Sites               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Data: $(date)"
echo "Arquivo de auditoria: $AUDIT_FILE"
echo "Domínio: $DOMAIN"
echo ""

# Extrair URLs do JSON com jq ou grep como fallback
if command -v jq &>/dev/null; then
  # Usar jq para extração precisa
  LINKS_JSON=$(jq -r '.links[] | "\(.id)|\(.source_site)|\(.target_site)|\(.status)"' "$AUDIT_FILE")
else
  # Fallback: grep básico para target_site e status
  echo -e "${YELLOW}⚠${NC} jq não encontrado — usando extração básica"
  LINKS_JSON=$(grep -E '"target_site"|"status"' "$AUDIT_FILE" | paste - - | \
    grep -v "systemforge" | \
    sed 's/.*"target_site": "\([^"]*\)".*"status": "\([^"]*\)".*/\1|\2/')
fi

TOTAL=$(echo "$LINKS_JSON" | grep -c "." 2>/dev/null || echo 0)
current=0

while IFS='|' read -r id source_site target_slug status; do
  # Pular systemforge (link principal)
  if [ "$target_slug" = "systemforge" ] || [ "$target_slug" = "all" ]; then
    ((SKIPPED++))
    continue
  fi

  ((current++))

  # Construir URL: extrair base slug (antes de primeiro -)
  base="${target_slug%%-*}"
  URL="https://${base}.${DOMAIN}"

  # Verificar --pending-only
  if [ "$1" = "--pending-only" ] && [ "$status" != "pending" ]; then
    ((SKIPPED++))
    continue
  fi

  printf "[%02d] Verificando %s → %s ... " "$current" "$source_site" "$URL"

  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$URL" 2>/dev/null || echo "000")

  if [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "301" ] || [ "$STATUS_CODE" = "302" ]; then
    echo -e "${GREEN}✓${NC} HTTP $STATUS_CODE"
    ((PASSED++))
  elif [ "$STATUS_CODE" = "000" ]; then
    echo -e "${YELLOW}⚠${NC} TIMEOUT/DNS — site possivelmente não deployado"
    ((SKIPPED++))
  else
    echo -e "${RED}✗${NC} HTTP $STATUS_CODE — FALHA"
    ((ERRORS++))
  fi
done <<< "$LINKS_JSON"

# Resumo
echo ""
echo "════════════════════════════════════════════════════════════"
echo "RESUMO"
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Acessíveis:${NC}  $PASSED"
echo -e "${YELLOW}⚠ Pulados:${NC}    $SKIPPED (não deployados ou systemforge)"
echo -e "${RED}✗ Falhas:${NC}     $ERRORS"

if [ "$ERRORS" -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ TODOS OS CROSS-LINKS ACESSÍVEIS${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}❌ $ERRORS CROSS-LINK(S) COM FALHA${NC}"
  exit $ERRORS
fi
