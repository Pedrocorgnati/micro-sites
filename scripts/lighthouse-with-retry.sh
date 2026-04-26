#!/bin/bash
# =============================================================================
# lighthouse-with-retry.sh — wrapper Lighthouse com retry exponencial
#
# Roda `lhci autorun` ate 3x com backoff entre tentativas. Util para CI onde
# erros transientes (network, Chrome timeout) sao comuns.
#
# TASK-26 ST003 / CL-276
#
# Uso:
#   ./scripts/lighthouse-with-retry.sh [args extras passados a lhci]
#
# Variaveis de ambiente:
#   LHCI_MAX_ATTEMPTS    (default: 3)
#   LHCI_BACKOFF_INITIAL (default: 30 segundos)
#   LHCI_BACKOFF_FACTOR  (default: 2 — backoff exponencial)
# =============================================================================

set -o pipefail

MAX_ATTEMPTS="${LHCI_MAX_ATTEMPTS:-3}"
BACKOFF="${LHCI_BACKOFF_INITIAL:-30}"
FACTOR="${LHCI_BACKOFF_FACTOR:-2}"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "[lhci-retry] tentativa ${attempt}/${MAX_ATTEMPTS}"

  if npx --yes lhci autorun "$@"; then
    echo "[lhci-retry] OK na tentativa ${attempt}"
    exit 0
  fi

  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "[lhci-retry] FAIL apos ${MAX_ATTEMPTS} tentativas"
    exit 1
  fi

  echo "[lhci-retry] falha — aguardando ${BACKOFF}s antes da proxima tentativa"
  sleep "$BACKOFF"

  BACKOFF=$((BACKOFF * FACTOR))
  attempt=$((attempt + 1))
done

exit 1
