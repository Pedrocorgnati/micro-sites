#!/usr/bin/env bash
# =============================================================================
# blog-monthly-cron.sh — Batch mensal de novos artigos em sites high-traffic
#
# Invocacao: cron dia 1 de cada mes (ver setup-cron.sh)
# Para cada site flagged em sites/*/config.json com blog.monthlyBatch=true:
#   1. gera 1 novo artigo via /blog:generate-briefs + /blog:write-articles
#   2. roda validate-articles.ts
#   3. commit + push + re-run lighthouse-batch.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

LOG="${ROOT_DIR}/blog-monthly.log"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[${TS}] blog-monthly-cron start" >> "$LOG"

# Descobrir sites com monthlyBatch habilitado
HIGH_TRAFFIC_SITES=$(find sites -name config.json -maxdepth 2 \
  -exec grep -l '"monthlyBatch"\s*:\s*true' {} \; | xargs -n1 dirname | xargs -n1 basename)

if [[ -z "$HIGH_TRAFFIC_SITES" ]]; then
  echo "[${TS}] nenhum site com monthlyBatch=true" >> "$LOG"
  exit 0
fi

for slug in $HIGH_TRAFFIC_SITES; do
  echo "[${TS}]   gerando artigo para $slug" >> "$LOG"
  # Placeholder — slash commands sao invocados via Claude Code CLI, fora do cron.
  # Em producao: disparar webhook/fila que aciona o pipeline /blog:* no runner.
  # Ex: curl -X POST "$BLOG_RUNNER_WEBHOOK" -d "{\"slug\":\"$slug\"}"
done

# Pos: validacao + lighthouse + notify
npx tsx scripts/validate-articles.ts >> "$LOG" 2>&1 || echo "[${TS}] validate-articles FAIL" >> "$LOG"
bash scripts/lighthouse-batch.sh >> "$LOG" 2>&1 || echo "[${TS}] lighthouse FAIL" >> "$LOG"

if [[ -n "${BLOG_NOTIFY_WEBHOOK:-}" ]]; then
  curl -fsS -X POST "$BLOG_NOTIFY_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"event\":\"blog-monthly\",\"ts\":\"$TS\"}" >> "$LOG" 2>&1 || true
fi

echo "[${TS}] blog-monthly-cron end" >> "$LOG"
