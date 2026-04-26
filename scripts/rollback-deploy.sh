#!/usr/bin/env bash
# =============================================================================
# rollback-deploy.sh — Reverte ultimo commit no branch deploy-{N} de um site
#
# Uso:
#   bash scripts/rollback-deploy.sh <slug>            # prompt confirmacao
#   bash scripts/rollback-deploy.sh <slug> --force    # sem prompt
#
# Resultado:
#   git revert HEAD no branch deploy-{N} + push origin deploy-{N}
#   Entrada em deploy-log.txt
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/deploy-map.sh"

SLUG="${1:-}"
FORCE=false
if [[ "${2:-}" == "--force" ]]; then
  FORCE=true
fi

if [[ -z "$SLUG" ]]; then
  echo "ERRO: slug obrigatorio. Uso: bash scripts/rollback-deploy.sh <slug> [--force]" >&2
  exit 1
fi

BRANCH="${DEPLOY_MAP[$SLUG]:-}"
if [[ -z "$BRANCH" ]]; then
  echo "ERRO: slug '$SLUG' nao encontrado em deploy-map." >&2
  exit 1
fi

echo "Rollback: $SLUG -> $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
LAST_SHA="$(git rev-parse --short HEAD)"
LAST_MSG="$(git log -1 --pretty=%s)"
echo "  Ultimo commit: $LAST_SHA — $LAST_MSG"

if [[ "$FORCE" != "true" ]]; then
  read -r -p "Confirmar revert + push para origin/$BRANCH? [y/N] " ANS
  if [[ "$ANS" != "y" && "$ANS" != "Y" ]]; then
    echo "Abortado."
    exit 0
  fi
fi

git revert HEAD --no-edit
git push origin "$BRANCH"

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[${TS}] rollback slug=${SLUG} branch=${BRANCH} reverted_sha=${LAST_SHA}" >> "${ROOT_DIR}/deploy-log.txt"

echo "Rollback concluido."
echo "Validar com: curl -I https://{dominio-do-site}/"
