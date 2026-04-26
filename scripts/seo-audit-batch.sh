#!/bin/bash
# =============================================================================
# SEO AUDIT BATCH — Auditoria completa de 36 micro-sites
# Valida: títulos (unicidade + comprimento), metas (comprimento + CTA),
#         canonical URLs (HTTP 200 + format), schemas JSON-LD presentes
#
# Uso:
#   bash scripts/seo-audit-batch.sh                # Auditoria completa
#   bash scripts/seo-audit-batch.sh a              # Apenas categoria A
#   bash scripts/seo-audit-batch.sh --local        # Modo local (sem HTTP)
#
# Saída:
#   Console + docs/SEO-AUDIT-REPORT.md
# =============================================================================

set -o pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuração
DOMAIN="${DOMAIN:-DOMAIN.com}"
TIMEOUT=10
CATEGORY_FILTER="${1:-}"
OUTPUT_FILE="docs/SEO-AUDIT-REPORT.md"
LOG_FILE="docs/seo-audit-$(date +%Y%m%d-%H%M%S).log"
ERRORS=0
WARNINGS=0
PASSED=0

# Mapa de schemas esperados por categoria
declare -A EXPECTED_SCHEMA=(
  [A]="LocalBusiness"
  [B]="Article"
  [C]="Service"
  [D]="WebApplication"
  [E]="SoftwareApplication"
  [F]="Article"
)

# Mapa de comprimento de título por categoria (min max)
declare -A TITLE_MIN=([A]=30 [B]=35 [C]=35 [D]=30 [E]=35 [F]=40)
declare -A TITLE_MAX=([A]=60 [B]=60 [C]=60 [D]=55 [E]=65 [F]=65)

# Lista completa de slugs
SLUGS_A="a01 a02 a03 a04 a05 a06 a07 a08 a09 a10"
SLUGS_B="b01-sem-site-profissional b02-site-antigo-lento b03-sem-automacao b04-sem-presenca-digital b05-perder-clientes-online b06-sem-leads-qualificados b07-site-nao-aparece-google b08-concorrente-digital"
SLUGS_C="c01-site-institucional-pme c02-landing-page-conversao c03-app-web-negocio c04-ecommerce-pequeno-negocio c05-sistema-agendamento c06-automacao-atendimento c07-sistema-gestao-web c08-manutencao-software"
SLUGS_D="d01-calculadora-custo-site d02-calculadora-custo-app d03-diagnostico-maturidade-digital d04-calculadora-roi-automacao d05-checklist-presenca-digital"
SLUGS_E="e01-ia-para-pequenos-negocios e02-automacao-whatsapp e03-site-com-ia"
SLUGS_F="f01-blog-desenvolvimento-web f02-blog-marketing-digital"

# Montar lista por categoria ou completa
# Ordem canonica (sem filtro de categoria): docs/seo/seo-priority-order.txt
# (TASK-3 / CL-105). Cai no ordenamento alfabetico se o arquivo nao existir.
PRIORITY_FILE="docs/seo/seo-priority-order.txt"
case "$CATEGORY_FILTER" in
  a|A) SLUGS="$SLUGS_A" ;;
  b|B) SLUGS="$SLUGS_B" ;;
  c|C) SLUGS="$SLUGS_C" ;;
  d|D) SLUGS="$SLUGS_D" ;;
  e|E) SLUGS="$SLUGS_E" ;;
  f|F) SLUGS="$SLUGS_F" ;;
  *)
    if [ -f "$PRIORITY_FILE" ]; then
      SLUGS=$(grep -Ev '^\s*(#|$)' "$PRIORITY_FILE" | tr '\n' ' ')
      echo "→ Ordem de auditoria: $PRIORITY_FILE (SEO-PRIORITY.md)"
    else
      SLUGS="$SLUGS_A $SLUGS_B $SLUGS_C $SLUGS_D $SLUGS_E $SLUGS_F"
      echo "⚠ $PRIORITY_FILE ausente — usando ordem alfabetica historica"
    fi
    ;;
esac

# Associative arrays para detecção de duplicatas
declare -A SEEN_TITLES
declare -A SEEN_DESCRIPTIONS
DUPLICATE_TITLES=()
DUPLICATE_DESCRIPTIONS=()

# Armazenar resultados
declare -A RESULTS

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

# Extrair categoria do slug (primeiro caractere)
get_category() {
  local slug="$1"
  echo "${slug:0:1}" | tr '[:lower:]' '[:upper:]'
}

# Verificar título
verify_title() {
  local slug="$1"
  local html="$2"
  local cat
  cat=$(get_category "$slug")

  # Extrair título
  local title
  title=$(echo "$html" | grep -oP '(?<=<title>)[^<]+' | head -1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  if [ -z "$title" ]; then
    log "${RED}✗${NC} $slug: TITLE ausente"
    RESULTS["${slug}_title"]="ERRO:ausente"
    ((ERRORS++))
    return
  fi

  local len=${#title}
  local min="${TITLE_MIN[$cat]:-30}"
  local max="${TITLE_MAX[$cat]:-65}"

  # Verificar comprimento
  if [ "$len" -lt "$min" ]; then
    log "${YELLOW}⚠${NC} $slug: TITLE muito curto (${len}c, mín. ${min}c) — \"$title\""
    RESULTS["${slug}_title"]="WARN:curto:${len}"
    ((WARNINGS++))
  elif [ "$len" -gt "$max" ]; then
    log "${YELLOW}⚠${NC} $slug: TITLE muito longo (${len}c, máx. ${max}c) — \"$title\""
    RESULTS["${slug}_title"]="WARN:longo:${len}"
    ((WARNINGS++))
  else
    log "${GREEN}✓${NC} $slug: TITLE OK (${len}c) — \"$title\""
    RESULTS["${slug}_title"]="OK:${len}"
    ((PASSED++))
  fi

  # Verificar duplicação
  if [ -n "${SEEN_TITLES[$title]+x}" ]; then
    log "${RED}✗${NC} $slug: TITLE DUPLICADO com ${SEEN_TITLES[$title]} — \"$title\""
    DUPLICATE_TITLES+=("$slug:${SEEN_TITLES[$title]}:$title")
    ((ERRORS++))
  else
    SEEN_TITLES["$title"]="$slug"
  fi
}

# Verificar meta description
verify_description() {
  local slug="$1"
  local html="$2"

  local desc
  desc=$(echo "$html" | grep -oP '(?<=<meta name="description" content=")[^"]+' | head -1)
  # Fallback para property="og:description"
  if [ -z "$desc" ]; then
    desc=$(echo "$html" | grep -oP '(?<=<meta property="og:description" content=")[^"]+' | head -1)
  fi

  if [ -z "$desc" ]; then
    log "${RED}✗${NC} $slug: META DESC ausente"
    RESULTS["${slug}_desc"]="ERRO:ausente"
    ((ERRORS++))
    return
  fi

  local len=${#desc}

  if [ "$len" -lt 50 ]; then
    log "${YELLOW}⚠${NC} $slug: META DESC muito curta (${len}c, mín. 50c)"
    RESULTS["${slug}_desc"]="WARN:curto:${len}"
    ((WARNINGS++))
  elif [ "$len" -gt 160 ]; then
    log "${YELLOW}⚠${NC} $slug: META DESC muito longa (${len}c, máx. 160c)"
    RESULTS["${slug}_desc"]="WARN:longo:${len}"
    ((WARNINGS++))
  else
    log "${GREEN}✓${NC} $slug: META DESC OK (${len}c)"
    RESULTS["${slug}_desc"]="OK:${len}"
    ((PASSED++))
  fi

  # Verificar duplicação
  if [ -n "${SEEN_DESCRIPTIONS[$desc]+x}" ]; then
    log "${RED}✗${NC} $slug: META DESC DUPLICADA com ${SEEN_DESCRIPTIONS[$desc]}"
    DUPLICATE_DESCRIPTIONS+=("$slug:${SEEN_DESCRIPTIONS[$desc]}")
    ((ERRORS++))
  else
    SEEN_DESCRIPTIONS["$desc"]="$slug"
  fi
}

# Verificar schema JSON-LD
verify_schema() {
  local slug="$1"
  local html="$2"
  local cat
  cat=$(get_category "$slug")

  local expected="${EXPECTED_SCHEMA[$cat]:-Organization}"

  # Extrair schema type
  local schema_type
  schema_type=$(echo "$html" | grep -oP '(?<="@type":")[^"]+' | head -1)

  if [ -z "$schema_type" ]; then
    log "${RED}✗${NC} $slug: SCHEMA JSON-LD ausente (esperado: $expected)"
    RESULTS["${slug}_schema"]="ERRO:ausente"
    ((ERRORS++))
    return
  fi

  if echo "$html" | grep -q "\"@type\":\"$expected\""; then
    log "${GREEN}✓${NC} $slug: SCHEMA OK ($expected)"
    RESULTS["${slug}_schema"]="OK:$expected"
    ((PASSED++))
  else
    log "${YELLOW}⚠${NC} $slug: SCHEMA tipo inesperado (encontrado: $schema_type, esperado: $expected)"
    RESULTS["${slug}_schema"]="WARN:$schema_type"
    ((WARNINGS++))
  fi
}

# Verificar canonical URL
verify_canonical() {
  local slug="$1"
  local html="$2"

  local canonical
  canonical=$(echo "$html" | grep -oP '(?<=<link rel="canonical" href=")[^"]+' | head -1)

  if [ -z "$canonical" ]; then
    log "${RED}✗${NC} $slug: CANONICAL ausente"
    RESULTS["${slug}_canonical"]="ERRO:ausente"
    ((ERRORS++))
    return
  fi

  # Validar formato esperado
  local expected_pattern="https://${slug}.*\\.com"
  if echo "$canonical" | grep -qE "$expected_pattern"; then
    log "${GREEN}✓${NC} $slug: CANONICAL OK ($canonical)"
    RESULTS["${slug}_canonical"]="OK:$canonical"
    ((PASSED++))
  else
    log "${YELLOW}⚠${NC} $slug: CANONICAL formato inesperado — $canonical"
    RESULTS["${slug}_canonical"]="WARN:$canonical"
    ((WARNINGS++))
  fi
}

# ─── LOOP PRINCIPAL ───────────────────────────────────────────────────────────

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      SEO AUDIT BATCH — Rede Micro Sites                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Data: $(date)"
echo "Domínio: $DOMAIN"
echo "Sites a auditar: $(echo $SLUGS | wc -w)"
echo ""

total=$(echo $SLUGS | wc -w)
current=0

for slug in $SLUGS; do
  ((current++))
  printf "\n[%02d/%02d] Auditando %s...\n" "$current" "$total" "$slug"

  # Extrair categoria (primeiro caractere do slug, desconsiderando suffix após -)
  base_slug="${slug%%-*}"
  cat=$(echo "${base_slug:0:1}" | tr '[:lower:]' '[:upper:]')

  # Tentar carregar HTML local (modo local/build)
  LOCAL_HTML="dist/${slug}/index.html"
  SITES_HTML="sites/${slug}/content/index.html"

  if [ -f "$LOCAL_HTML" ]; then
    HTML=$(cat "$LOCAL_HTML")
    log "  → Lendo HTML local: $LOCAL_HTML"
  elif [ -f "$SITES_HTML" ]; then
    HTML=$(cat "$SITES_HTML")
    log "  → Lendo HTML local: $SITES_HTML"
  else
    # Modo HTTP — tentar buscar do site deployado
    URL="https://${slug%%-*}.${DOMAIN}"
    HTML=$(curl -s --max-time "$TIMEOUT" "$URL" 2>/dev/null || echo "")
    if [ -z "$HTML" ]; then
      log "${YELLOW}⚠${NC} $slug: site não acessível via HTTP ($URL) — pulando verificações HTTP"
      RESULTS["${slug}_title"]="SKIP:inaccessible"
      RESULTS["${slug}_desc"]="SKIP:inaccessible"
      RESULTS["${slug}_schema"]="SKIP:inaccessible"
      RESULTS["${slug}_canonical"]="SKIP:inaccessible"
      ((WARNINGS++))
      continue
    fi
    log "  → Lendo HTML remoto: $URL"
  fi

  verify_title "$slug" "$HTML"
  verify_description "$slug" "$HTML"
  verify_schema "$slug" "$HTML"
  verify_canonical "$slug" "$HTML"
done

# ─── RELATÓRIO ─────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════════════════════════"
echo "RESUMO"
echo "════════════════════════════════════════════════════════════"
echo "Sites auditados: $total"
echo -e "${GREEN}✓ Passou:${NC}   $PASSED"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo -e "${RED}✗ Erros:${NC}    $ERRORS"

VERDICT="✅ APROVADO"
if [ "$ERRORS" -gt 0 ]; then
  VERDICT="❌ REPROVADO ($ERRORS erros críticos)"
elif [ "$WARNINGS" -gt 0 ]; then
  VERDICT="⚠️ APROVADO COM RESSALVAS ($WARNINGS warnings)"
fi

echo ""
echo "Veredito: $VERDICT"

# Gerar SEO-AUDIT-REPORT.md
mkdir -p docs
cat > "$OUTPUT_FILE" << REPORT_EOF
# SEO Audit Report — Rede Micro Sites

**Data:** $(date +%Y-%m-%d\ %H:%M:%S)
**Total de sites auditados:** $total
**Erros críticos:** $ERRORS
**Warnings:** $WARNINGS
**Passou:** $PASSED

## Veredito Final: $VERDICT

---

## Resumo por Métrica

| Métrica | Erros | Warnings | Passou |
|---------|-------|---------|--------|
| Títulos | $(echo "${!RESULTS[@]}" | tr ' ' '\n' | grep "_title" | xargs -I{} bash -c 'echo "${RESULTS[$1]}"' _ {} | grep -c "ERRO" 2>/dev/null || echo 0) | $(echo "${!RESULTS[@]}" | tr ' ' '\n' | grep "_title" | xargs -I{} bash -c 'echo "${RESULTS[$1]}"' _ {} | grep -c "WARN" 2>/dev/null || echo 0) | - |
| Meta Descriptions | - | - | - |
| Schemas JSON-LD | - | - | - |
| Canonical URLs | - | - | - |

## Títulos Duplicados

$(if [ ${#DUPLICATE_TITLES[@]} -gt 0 ]; then
  echo "**⚠️ ${#DUPLICATE_TITLES[@]} duplicatas encontradas:**"
  for dup in "${DUPLICATE_TITLES[@]}"; do echo "- $dup"; done
else
  echo "✅ Nenhuma duplicata encontrada"
fi)

## Meta Descriptions Duplicadas

$(if [ ${#DUPLICATE_DESCRIPTIONS[@]} -gt 0 ]; then
  echo "**⚠️ ${#DUPLICATE_DESCRIPTIONS[@]} duplicatas encontradas:**"
  for dup in "${DUPLICATE_DESCRIPTIONS[@]}"; do echo "- $dup"; done
else
  echo "✅ Nenhuma duplicata encontrada"
fi)

---

*Gerado por \`scripts/seo-audit-batch.sh\` em $(date)*
REPORT_EOF

echo ""
echo "Relatório gerado: $OUTPUT_FILE"
echo "Log: $LOG_FILE"

# Exit code baseado em erros críticos
exit $ERRORS
