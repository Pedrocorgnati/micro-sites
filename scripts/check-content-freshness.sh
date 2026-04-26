#!/usr/bin/env bash
# =============================================================================
# check-content-freshness.sh — Verifica frescor de conteudo dos micro-sites
#
# Lê campo lastReviewed dos config.json e alerta sobre sites desatualizados:
#   [STALE]   — 90+ dias sem revisão
#   [WARNING] — 60-89 dias sem revisão
#   [OK]      — < 60 dias
#
# Uso:
#   bash scripts/check-content-freshness.sh
#   bash scripts/check-content-freshness.sh --stale-only
#
# Exit code:
#   0 — nenhum STALE
#   N — N sites com status STALE
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/sites"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

STALE_ONLY="${1:-}"
STALE=0
WARNING=0
OK=0

TODAY=$(date +%s)

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CONTENT FRESHNESS CHECK — Micro Sites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

for config_path in "$SITES_DIR"/*/config.json; do
  [[ "$(basename "$(dirname "$config_path")")" == "_template" ]] && continue

  slug=$(node -e "process.stdout.write(require('$config_path').slug ?? '')" 2>/dev/null || true)
  last_reviewed=$(node -e "process.stdout.write(require('$config_path').lastReviewed ?? '')" 2>/dev/null || true)

  [[ -z "$slug" ]] && continue

  if [[ -z "$last_reviewed" ]]; then
    echo -e "${RED}[STALE]${NC}   $slug — sem campo lastReviewed"
    STALE=$((STALE + 1))
    continue
  fi

  # Calcular dias desde última revisão
  review_ts=$(date -d "$last_reviewed" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$last_reviewed" +%s 2>/dev/null || echo 0)
  days_since=$(( (TODAY - review_ts) / 86400 ))

  if [[ $days_since -ge 90 ]]; then
    [[ -z "$STALE_ONLY" || "$STALE_ONLY" == "--stale-only" ]] && \
      echo -e "${RED}[STALE]${NC}   $slug — última revisão: $last_reviewed (${days_since} dias)"
    STALE=$((STALE + 1))
  elif [[ $days_since -ge 60 ]]; then
    [[ -z "$STALE_ONLY" ]] && \
      echo -e "${YELLOW}[WARNING]${NC} $slug — última revisão: $last_reviewed (${days_since} dias)"
    WARNING=$((WARNING + 1))
  else
    [[ -z "$STALE_ONLY" ]] && \
      echo -e "${GREEN}[OK]${NC}      $slug — última revisão: $last_reviewed (${days_since} dias)"
    OK=$((OK + 1))
  fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}OK:${NC}      $OK sites"
echo -e "${YELLOW}WARNING:${NC} $WARNING sites (60-89 dias)"
echo -e "${RED}STALE:${NC}   $STALE sites (90+ dias)"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# -----------------------------------------------------------------------------
# Secondary signal: mtime de content/*.md > 90 dias (CL-073/CL-228)
# -----------------------------------------------------------------------------
MTIME_STALE=0
echo ""
echo -e "${BLUE}━━━ MTIME dos .md em sites/*/content/ (>90 dias) ━━━${NC}"
while IFS= read -r -d '' f; do
  if [[ $(find "$f" -mtime +90 -print 2>/dev/null) ]]; then
    [[ -z "$STALE_ONLY" || "$STALE_ONLY" == "--stale-only" ]] && \
      echo -e "${RED}[MTIME-STALE]${NC} $f"
    MTIME_STALE=$((MTIME_STALE + 1))
  fi
done < <(find "$SITES_DIR" -type f -name '*.md' -not -path '*/_template/*' -print0 2>/dev/null)

if [[ $MTIME_STALE -gt 0 ]]; then
  STALE=$((STALE + MTIME_STALE))
  echo -e "${YELLOW}→ $MTIME_STALE arquivo(s) de conteudo com mtime > 90 dias${NC}"
else
  echo -e "${GREEN}✓ Todos os .md modificados ha menos de 90 dias${NC}"
fi

# -----------------------------------------------------------------------------
# TASK-4 intake-review (CL-096, CL-258): output estruturado JSON + soft-exit
# -----------------------------------------------------------------------------
OUT_JSON="output/metrics/content-freshness.json"
mkdir -p "$(dirname "$OUT_JSON")"

{
  echo '{'
  echo "  \"generatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"stale\": $STALE,"
  echo "  \"warning\": $WARNING,"
  echo "  \"ok\": $OK,"
  echo "  \"mtime_stale\": $MTIME_STALE,"
  echo '  "sites": ['
  first=1
  while IFS= read -r -d '' config; do
    slug=$(basename "$(dirname "$config")")
    [[ "$slug" == "_template" ]] && continue
    last_reviewed=$(grep -Eo '"lastReviewed"[[:space:]]*:[[:space:]]*"[^"]*"' "$config" 2>/dev/null | sed 's/.*"\([0-9-]*\)".*/\1/' || echo "")
    stale_md=$(find "$(dirname "$config")/content" -name '*.md' -mtime +90 2>/dev/null | wc -l | tr -d ' ')
    [[ $first -eq 1 ]] && first=0 || echo ","
    printf '    { "slug": "%s", "lastReviewed": "%s", "stale_md_files": %s }' "$slug" "$last_reviewed" "$stale_md"
  done < <(find "$SITES_DIR" -type f -name 'config.json' -not -path '*/_template/*' -print0 2>/dev/null)
  echo ''
  echo '  ]'
  echo '}'
} > "$OUT_JSON"

echo ""
echo -e "${BLUE}→ JSON freshness:${NC} $OUT_JSON"

if [[ $STALE -gt 0 ]]; then
  echo -e "${YELLOW}⚠ $STALE site(s) com conteudo desatualizado (90+ dias) — soft warning${NC}"
else
  echo -e "${GREEN}✅ Nenhum site com conteúdo crítico desatualizado${NC}"
fi
# TASK-4: exit 0 para nao bloquear deploy (gate e soft)
exit 0
