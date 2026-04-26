#!/usr/bin/env bash
# release-tag-wave.sh (CL-632)
# Cria tag git wave-{N}-{YYYY-MM-DD} e faz push.
# Uso: scripts/release-tag-wave.sh wave-1
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <wave-N>"
  echo "Ex:  $0 wave-1"
  exit 1
fi

wave="$1"
date_iso=$(date -u +%Y-%m-%d)
tag="${wave}-${date_iso}"

echo "Criando tag: ${tag}"
git tag -a "${tag}" -m "Wave ${wave} release ${date_iso}"
git push origin "${tag}"
echo "Tag ${tag} publicada."
