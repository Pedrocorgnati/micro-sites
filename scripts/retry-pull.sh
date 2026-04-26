#!/usr/bin/env bash
# retry-pull.sh (CL-631)
# Wrapper de git pull com 3 tentativas e mensagens humanas.
set -uo pipefail

for i in 1 2 3; do
  if git pull "$@"; then
    exit 0
  fi
  echo "[$i/3] GitHub indisponivel ou rede instavel, aguardando 5s..."
  sleep 5
done

echo "GitHub continua indisponivel apos 3 tentativas."
echo "Tente novamente em alguns minutos ou verifique https://www.githubstatus.com/"
exit 1
