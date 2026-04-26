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
    --help|-h)
      echo ""
      echo "Uso: bash scripts/deploy-all.sh [flags]"
      echo ""
      echo "Builda e deploya todos os micro-sites (ou filtro por categoria/wave/slug)."
      echo ""
      echo "Flags:"
      echo "  --category A|B|C|D|E|F   Filtra por categoria"
      echo "  --wave 1|2|3              Filtra por wave de deploy"
      echo "  --slug <slug>             Processa apenas este site"
      echo "  --dry-run                 Não faz push para o remote"
      echo "  --skip-og                 Pula geração de OG images"
      echo "  --skip-validate           Pula validação de config.json"
      echo "  --parallel N              N workers paralelos (default: 1, requer xargs -P)"
      echo "  -h, --help                Exibe esta mensagem"
      echo ""
      echo "Exemplos:"
      echo "  bash scripts/deploy-all.sh --dry-run"
      echo "  bash scripts/deploy-all.sh --wave 1"
      echo "  bash scripts/deploy-all.sh --category D --dry-run"
      echo "  bash scripts/deploy-all.sh --slug d01-calculadora-custo-site"
      echo "  bash scripts/deploy-all.sh --parallel 4"
      echo ""
      exit 0 ;;
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

BUILD_FLAGS=""
[[ "$SKIP_OG" == "true" ]]       && BUILD_FLAGS="$BUILD_FLAGS --skip-og"
[[ "$SKIP_VALIDATE" == "true" ]] && BUILD_FLAGS="$BUILD_FLAGS --skip-validate"

DEPLOY_FLAGS=""
[[ "$DRY_RUN" == "true" ]] && DEPLOY_FLAGS="$DEPLOY_FLAGS --dry-run"

# ---------------------------------------------------------------------------
# Prepara pares slug:branch (filtrando slugs sem branch no deploy-map)
# ---------------------------------------------------------------------------

declare -a SLUG_BRANCH_PAIRS=()
WARNINGS=0
declare -a WARN_SLUGS=()

for SLUG in "${TARGET_SLUGS[@]}"; do
  BRANCH="${DEPLOY_MAP[$SLUG]:-}"
  if [[ -z "$BRANCH" ]]; then
    WARN_SLUGS+=("$SLUG")
    WARNINGS=$((WARNINGS + 1))
  else
    SLUG_BRANCH_PAIRS+=("${SLUG}:${BRANCH}")
  fi
done

for w in "${WARN_SLUGS[@]}"; do
  log_warn "[$w] Não está no deploy-map. Pulando."
done

# ---------------------------------------------------------------------------
# Função de build + deploy por site (exportada para uso com xargs -P)
# ---------------------------------------------------------------------------

_deploy_one() {
  local pair="$1"
  local sd="$2"
  local bf="$3"
  local df="$4"

  local slug="${pair%%:*}"
  local branch="${pair##*:}"
  local log_file="/tmp/build-log-${slug}.txt"

  {
    echo "=== $slug → $branch ==="
    if bash "$sd/build-site.sh" "$slug" $bf; then
      if bash "$sd/deploy-branch.sh" "$slug" "$branch" $df; then
        echo "STATUS:OK"
      else
        echo "STATUS:DEPLOY_FAIL"
      fi
    else
      echo "STATUS:BUILD_FAIL"
    fi
  } > "$log_file" 2>&1

  grep "^STATUS:" "$log_file" | tail -1
}
export -f _deploy_one

# ---------------------------------------------------------------------------
# Execução: paralela (PARALLEL > 1) ou sequencial (default)
# ---------------------------------------------------------------------------

SUCCESSES=0
ERRORS=0
declare -a ERROR_SLUGS=()

if [[ "$PARALLEL" -gt 1 ]]; then
  log_info "Modo paralelo: $PARALLEL workers"

  export SCRIPT_DIR BUILD_FLAGS DEPLOY_FLAGS

  printf '%s\n' "${SLUG_BRANCH_PAIRS[@]}" | \
    xargs -P "$PARALLEL" -I '{}' bash -c '_deploy_one "$@"' _ '{}' "$SCRIPT_DIR" "$BUILD_FLAGS" "$DEPLOY_FLAGS"

  # Coleta resultados dos log files
  for pair in "${SLUG_BRANCH_PAIRS[@]}"; do
    SLUG="${pair%%:*}"
    BRANCH="${pair##*:}"
    STATUS=$(grep "^STATUS:" "/tmp/build-log-${SLUG}.txt" 2>/dev/null | tail -1 || echo "STATUS:UNKNOWN")
    case "$STATUS" in
      STATUS:OK)          echo -e "${GREEN}✓${NC} $SLUG → $BRANCH"; SUCCESSES=$((SUCCESSES + 1)) ;;
      STATUS:DEPLOY_FAIL) echo -e "${RED}✗${NC} $SLUG — falha no deploy (ver /tmp/build-log-${SLUG}.txt)"; ERRORS=$((ERRORS+1)); ERROR_SLUGS+=("$SLUG") ;;
      *)                  echo -e "${RED}✗${NC} $SLUG — falha no build  (ver /tmp/build-log-${SLUG}.txt)"; ERRORS=$((ERRORS+1)); ERROR_SLUGS+=("$SLUG") ;;
    esac
  done

else
  # Modo sequencial
  IDX=1
  for pair in "${SLUG_BRANCH_PAIRS[@]}"; do
    SLUG="${pair%%:*}"
    BRANCH="${pair##*:}"

    echo ""
    echo -e "${BLUE}━━━ [$IDX/${#SLUG_BRANCH_PAIRS[@]}] $SLUG → $BRANCH ━━━${NC}"

    if bash "$SCRIPT_DIR/build-site.sh" "$SLUG" $BUILD_FLAGS; then
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

    IDX=$((IDX + 1))
  done
fi

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
echo "  Resumo: ${SUCCESSES} PASS / ${ERRORS} FAIL"
echo ""

# Persist aggregate log (CL-054)
DEPLOY_LOG="${ROOT_DIR}/deploy-log.txt"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
{
  echo "[${TS}] deploy-all — total=${TOTAL_SITES} pass=${SUCCESSES} fail=${ERRORS} warn=${WARNINGS} dur=${TOTAL_MIN}m${TOTAL_SEC}s dry_run=${DRY_RUN}"
  if [[ ${#ERROR_SLUGS[@]} -gt 0 ]]; then
    echo "[${TS}]   failed_slugs=${ERROR_SLUGS[*]}"
  fi
} >> "$DEPLOY_LOG"

# Rotate if >5MB
if [[ -f "$DEPLOY_LOG" ]] && [[ $(stat -c%s "$DEPLOY_LOG" 2>/dev/null || stat -f%z "$DEPLOY_LOG") -gt 5242880 ]]; then
  mv "$DEPLOY_LOG" "${DEPLOY_LOG}.$(date +%Y%m%d).old"
fi

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

# ---------------------------------------------------------------------------
# Pós-deploy: aplica cross-wave interlinking (CL-115)
# Roda sempre — em dry-run gera report sem tocar no remote.
# ---------------------------------------------------------------------------

log_info "Aplicando cross-wave interlinking pós-deploy..."
if (cd "$ROOT_DIR" && npx tsx scripts/apply-cross-wave-links.ts); then
  log_ok "cross-wave-report gravado em output/cross-wave-report.json"
else
  log_warn "apply-cross-wave-links.ts falhou. Veja output/cross-wave-report.json."
fi

echo -e "${GREEN}DEPLOY ALL CONCLUÍDO COM SUCESSO!${NC}"
echo ""
