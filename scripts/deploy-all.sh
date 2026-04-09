#!/usr/bin/env bash
# =============================================================================
# deploy-all.sh — Build + deploy de todos os micro-sites (ou filtro por categoria/wave)
#
# Uso:
#   bash scripts/deploy-all.sh                    # Todos os sites
#   bash scripts/deploy-all.sh --category D       # Apenas Categoria D
#   bash scripts/deploy-all.sh --wave 1           # Apenas Wave 1
#   bash scripts/deploy-all.sh --slug c01-site-institucional-pme  # Site específico
#   bash scripts/deploy-all.sh --dry-run          # Simula sem push
#   bash scripts/deploy-all.sh --skip-og          # Pula OG images
#   bash scripts/deploy-all.sh --category D --dry-run  # Combinação de flags
#
# Flags:
#   --category A|B|C|D|E|F   Filtra por categoria
#   --wave 1|2|3              Filtra por wave de deploy
#   --slug <slug>             Processa apenas este site
#   --dry-run                 Não faz push para o remote
#   --skip-og                 Pula geração de OG images
#   --skip-validate           Pula validação de config.json
#   --parallel N              Paraleliza builds (padrão: 1, requer GNU parallel)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Carrega o mapeamento de deploys
source "$SCRIPT_DIR/deploy-map.sh"

# ---------------------------------------------------------------------------
# Flags
# ---------------------------------------------------------------------------

FILTER_CATEGORY=""
FILTER_WAVE=""
FILTER_SLUG=""
DRY_RUN=false
SKIP_OG=false
SKIP_VALIDATE=false
PARALLEL=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --category)    FILTER_CATEGORY="$2"; shift 2 ;;
    --wave)        FILTER_WAVE="$2"; shift 2 ;;
    --slug)        FILTER_SLUG="$2"; shift 2 ;;
    --dry-run)     DRY_RUN=true; shift ;;
    --skip-og)     SKIP_OG=true; shift ;;
    --skip-validate) SKIP_VALIDATE=true; shift ;;
    --parallel)    PARALLEL="$2"; shift 2 ;;
    *) echo "Flag desconhecida: $1" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERRO]${NC}  $1" >&2; }

TOTAL_START=$(date +%s)

# ---------------------------------------------------------------------------
# Monta lista de slugs a processar
# ---------------------------------------------------------------------------

declare -a TARGET_SLUGS=()

# Itera pelo deploy-map na ordem de branches
while IFS=' ' read -r slug branch; do
  [[ -z "$slug" ]] && continue

  # Filtro por slug específico
  if [[ -n "$FILTER_SLUG" ]] && [[ "$slug" != "$FILTER_SLUG" ]]; then
    continue
  fi

  # Filtro por categoria (primeiro char do slug, maiúsculo)
  if [[ -n "$FILTER_CATEGORY" ]]; then
    SLUG_CAT="${slug:0:1}"
    SLUG_CAT_UPPER="${SLUG_CAT^^}"
    if [[ "$SLUG_CAT_UPPER" != "$FILTER_CATEGORY" ]]; then
      continue
    fi
  fi

  # Filtro por wave (lê do config.json se o site existe)
  if [[ -n "$FILTER_WAVE" ]]; then
    CONFIG_FILE="$ROOT_DIR/sites/$slug/config.json"
    if [[ -f "$CONFIG_FILE" ]]; then
      SITE_WAVE=$(node -e "console.log(require('$CONFIG_FILE').deployWave ?? 1)" 2>/dev/null || echo "1")
      if [[ "$SITE_WAVE" != "$FILTER_WAVE" ]]; then
        continue
      fi
    fi
  fi

  # Inclui apenas sites que existem em sites/
  if [[ -d "$ROOT_DIR/sites/$slug" ]]; then
    TARGET_SLUGS+=("$slug")
  fi

done < <(deploy_map_all_slugs)

TOTAL_SITES=${#TARGET_SLUGS[@]}

if [[ $TOTAL_SITES -eq 0 ]]; then
  log_warn "Nenhum site encontrado com os filtros aplicados."
  log_warn "Verifique se os sites existem em sites/ e se os filtros estão corretos."
  exit 0
fi

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  DEPLOY ALL — $TOTAL_SITES site(s)${NC}"
if [[ -n "$FILTER_CATEGORY" ]]; then echo -e "  Categoria: $FILTER_CATEGORY"; fi
if [[ -n "$FILTER_WAVE" ]];     then echo -e "  Wave: $FILTER_WAVE"; fi
if [[ -n "$FILTER_SLUG" ]];     then echo -e "  Slug: $FILTER_SLUG"; fi
if [[ "$DRY_RUN" == "true" ]];  then echo -e "${YELLOW}  [DRY RUN]${NC}"; fi
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ---------------------------------------------------------------------------
# Loop de build + deploy
# ---------------------------------------------------------------------------

SUCCESSES=0
WARNINGS=0
ERRORS=0
declare -a ERROR_SLUGS=()

BUILD_FLAGS=""
[[ "$SKIP_OG" == "true" ]]       && BUILD_FLAGS="$BUILD_FLAGS --skip-og"
[[ "$SKIP_VALIDATE" == "true" ]] && BUILD_FLAGS="$BUILD_FLAGS --skip-validate"

DEPLOY_FLAGS=""
[[ "$DRY_RUN" == "true" ]] && DEPLOY_FLAGS="$DEPLOY_FLAGS --dry-run"

for SLUG in "${TARGET_SLUGS[@]}"; do
  BRANCH="${DEPLOY_MAP[$SLUG]:-}"

  if [[ -z "$BRANCH" ]]; then
    log_warn "[$SLUG] Não está no deploy-map. Pulando."
    WARNINGS=$((WARNINGS + 1))
    continue
  fi

  echo ""
  echo -e "${BLUE}━━━ [$((SUCCESSES + ERRORS + WARNINGS + 1))/$TOTAL_SITES] $SLUG → $BRANCH ━━━${NC}"

  # Build
  if bash "$SCRIPT_DIR/build-site.sh" "$SLUG" $BUILD_FLAGS; then
    # Deploy
    if bash "$SCRIPT_DIR/deploy-branch.sh" "$SLUG" "$BRANCH" $DEPLOY_FLAGS; then
      SUCCESSES=$((SUCCESSES + 1))
    else
      log_error "[$SLUG] Falha no deploy. Continuando com próximo site."
      ERRORS=$((ERRORS + 1))
      ERROR_SLUGS+=("$SLUG")
    fi
  else
    log_error "[$SLUG] Falha no build. Pulando deploy."
    ERRORS=$((ERRORS + 1))
    ERROR_SLUGS+=("$SLUG")
  fi
done

# ---------------------------------------------------------------------------
# Relatório final
# ---------------------------------------------------------------------------

TOTAL_END=$(date +%s)
TOTAL_DURATION=$((TOTAL_END - TOTAL_START))
TOTAL_MIN=$((TOTAL_DURATION / 60))
TOTAL_SEC=$((TOTAL_DURATION % 60))

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  DEPLOY ALL — RELATÓRIO FINAL"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Total:     $TOTAL_SITES site(s)"
echo -e "  ${GREEN}Sucesso:${NC}   $SUCCESSES"
echo -e "  ${YELLOW}Warnings:${NC}  $WARNINGS"
echo -e "  ${RED}Erros:${NC}     $ERRORS"
echo "  Duração:   ${TOTAL_MIN}m ${TOTAL_SEC}s"
echo ""

if [[ ${#ERROR_SLUGS[@]} -gt 0 ]]; then
  echo -e "${RED}Sites com erro:${NC}"
  for s in "${ERROR_SLUGS[@]}"; do
    echo "  - $s"
  done
  echo ""
  echo "Para retentar apenas os sites com erro:"
  for s in "${ERROR_SLUGS[@]}"; do
    echo "  bash scripts/build-site.sh $s && bash scripts/deploy-branch.sh $s ${DEPLOY_MAP[$s]:-deploy-NN}"
  done
  echo ""
  exit 1
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}[DRY RUN] Nenhum push foi feito.${NC}"
fi

echo -e "${GREEN}DEPLOY ALL CONCLUÍDO COM SUCESSO!${NC}"
echo ""
