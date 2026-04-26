#!/usr/bin/env bash
# Monthly metrics pipeline — invocado pelo cron.
set -o pipefail
cd "$(dirname "$0")/../.." || exit 1

echo "[$(date -Iseconds)] metrics:run-monthly start"

npx tsx scripts/metrics/collect-gsc.ts
npx tsx scripts/metrics/collect-ga4.ts
npx tsx scripts/metrics/collect-leads.ts
npx tsx scripts/metrics/aggregate.ts

# Webhook opcional (METRICS_WEBHOOK_URL — slack/discord)
if [[ -n "${METRICS_WEBHOOK_URL:-}" ]]; then
  TODAY=$(date +%Y-%m-%d)
  DASH="output/metrics/dashboard-${TODAY}.html"
  curl -fsS -X POST -H 'Content-Type: application/json' \
    -d "{\"text\":\":bar_chart: Dashboard gerado: ${DASH}\"}" \
    "${METRICS_WEBHOOK_URL}" || echo "[webhook] falhou (ignorado)"
fi

echo "[$(date -Iseconds)] metrics:run-monthly done"
