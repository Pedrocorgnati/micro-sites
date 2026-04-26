#!/usr/bin/env bash
# =============================================================================
# blog-pipeline-wrapper.sh — Ponte entre SystemForge /blog:* e o workspace
#
# Invoca Claude Code CLI com os comandos /blog:* apropriados por cadencia.
# Requer no runner:
#   - claude CLI (instalar: `npm i -g @anthropic-ai/claude-code`)
#   - ANTHROPIC_API_KEY ou CLAUDE_AUTH_TOKEN exportado
#   - .claude/projects/micro-sites.json (checked-in)
#
# Uso:
#   ./scripts/blog-pipeline-wrapper.sh --mode=daily   --site=a01
#   ./scripts/blog-pipeline-wrapper.sh --mode=monthly [--site=ALL|slug]
#   ./scripts/blog-pipeline-wrapper.sh --mode=refresh --site=a01
#
# Exit codes:
#   0  ok
#   2  uso invalido
#   3  CLI ausente
#   4  comando falhou
# =============================================================================
set -euo pipefail

MODE=""
SITE="ALL"
DRY_RUN=0
LOG_DIR="logs/blog-pipeline"
DATE_STAMP="$(date +'%Y-%m-%d')"
TS="$(date +'%Y-%m-%dT%H:%M:%S')"

usage() {
  sed -n '3,20p' "$0"
  exit 2
}

for arg in "$@"; do
  case "$arg" in
    --mode=*) MODE="${arg#*=}" ;;
    --site=*) SITE="${arg#*=}" ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) usage ;;
    *) echo "[wrapper] flag desconhecida: $arg" >&2; usage ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "[wrapper] --mode e obrigatorio" >&2
  usage
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "[wrapper] ERRO: claude CLI nao encontrado. Instale com: npm i -g @anthropic-ai/claude-code" >&2
  exit 3
fi

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${DATE_STAMP}-${MODE}.log"

log() { echo "[$TS] $*" | tee -a "$LOG_FILE"; }

run_claude() {
  local cmd="$1"
  local label="$2"
  log "-> $label: $cmd"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "   [dry-run] skip"
    return 0
  fi
  if ! claude -p "$cmd" >> "$LOG_FILE" 2>&1; then
    log "   FALHOU: $label"
    return 4
  fi
  log "   OK: $label"
}

resolve_sites() {
  if [[ "$SITE" == "ALL" ]]; then
    # Sites com blog habilitado (hasBlog: true)
    find sites -maxdepth 2 -name config.json -not -path '*_template*' -not -path '*.template*' \
      -exec grep -l '"hasBlog": true' {} \; \
      | awk -F/ '{print $2}' \
      | sort -u
  else
    echo "$SITE"
  fi
}

case "$MODE" in
  daily)
    if [[ "$SITE" == "ALL" ]]; then
      echo "[wrapper] --site e obrigatorio em --mode=daily" >&2
      exit 2
    fi
    log "=== DAILY pipeline — site=$SITE ==="
    run_claude "/blog:write-articles --site=$SITE --limit=1" "write-articles"
    run_claude "/blog:eeat-inject --site=$SITE" "eeat-inject"
    run_claude "/blog:quality-gate --site=$SITE" "quality-gate"
    run_claude "/blog:build-metadata --site=$SITE" "build-metadata"
    ;;

  monthly)
    log "=== MONTHLY pipeline — scope=$SITE ==="
    SLUGS="$(resolve_sites)"
    if [[ -z "$SLUGS" ]]; then
      log "Nenhum site com hasBlog=true encontrado."
      exit 0
    fi
    log "Sites elegiveis: $(echo "$SLUGS" | tr '\n' ' ')"

    # Fase de planejamento (por site)
    for s in $SLUGS; do
      log "--- planning $s ---"
      run_claude "/blog:expand-keywords --site=$s"     "expand-keywords"
      run_claude "/blog:cluster-keywords --site=$s"    "cluster-keywords"
      run_claude "/blog:discover-intents --site=$s"    "discover-intents"
      run_claude "/blog:prioritize-topics --site=$s"   "prioritize-topics"
      run_claude "/blog:generate-briefs --site=$s"     "generate-briefs"
    done

    # Fase de producao (por site)
    for s in $SLUGS; do
      log "--- producing $s ---"
      run_claude "/blog:write-articles --site=$s"      "write-articles"
      run_claude "/blog:eeat-inject --site=$s"         "eeat-inject"
      run_claude "/blog:quality-gate --site=$s"        "quality-gate"
      run_claude "/blog:build-metadata --site=$s"      "build-metadata"
      run_claude "/blog:review-seo --site=$s"          "review-seo"
    done

    # Fase de interlinking + schedule (pos producao)
    for s in $SLUGS; do
      run_claude "/blog:build-internal-links --site=$s" "build-internal-links"
      run_claude "/blog:schedule-batch --site=$s"       "schedule-batch"
    done
    ;;

  refresh)
    if [[ "$SITE" == "ALL" ]]; then
      echo "[wrapper] --site e obrigatorio em --mode=refresh" >&2
      exit 2
    fi
    log "=== REFRESH pipeline — site=$SITE ==="
    run_claude "/blog:analytics-review --site=$SITE"  "analytics-review"
    run_claude "/blog:refresh-content --site=$SITE"   "refresh-content"
    run_claude "/blog:review-seo --site=$SITE"        "review-seo"
    ;;

  *)
    echo "[wrapper] --mode invalido: $MODE (valores: daily|monthly|refresh)" >&2
    exit 2
    ;;
esac

log "=== DONE mode=$MODE site=$SITE ==="
