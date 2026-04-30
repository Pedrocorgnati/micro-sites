#!/bin/bash
# scripts/build-all.sh
# Build sequencial de todos os 36 sites micro-sites
# Uso: ./scripts/build-all.sh [--dry-run] [--slug SLUG]

set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
INTEGRATION_DIR="$(cd "$WORKSPACE/../../.." && pwd)/output/docs/micro-sites/integration"
LOG_DIR="/tmp/micro-sites-build-logs"
REPORT="$INTEGRATION_DIR/TASK-1-BUILD-REPORT.md"
DRY_RUN=false
FILTER_SLUG=""

mkdir -p "$LOG_DIR" "$INTEGRATION_DIR"

# Parse args
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --slug) shift; FILTER_SLUG="${1:-}" ;;
  esac
done

# Lista de slugs (diretórios em sites/)
SLUGS=$(ls "$WORKSPACE/sites/" | grep -v '^_template$' | sort)

SUCCESS=0
FAIL=0
FAILED_SITES=""
SKIP=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Build-all micro-sites — $(date '+%Y-%m-%d %H:%M')"
echo " Workspace: $WORKSPACE"
echo " Sites: $(echo "$SLUGS" | wc -l | tr -d ' ')"
[ "$DRY_RUN" = true ] && echo " Modo: DRY-RUN (sem build real)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for slug in $SLUGS; do
  # Filtro opcional por slug
  if [ -n "$FILTER_SLUG" ] && [ "$slug" != "$FILTER_SLUG" ]; then
    ((SKIP++)) || true
    continue
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY] $slug — pulado (dry-run)"
    ((SUCCESS++)) || true
    continue
  fi

  echo -n "  Building $slug... "
  # ADS-REV-05: usar `npm run build` para garantir prebuild hook (gera ads.txt etc).
  if SITE_SLUG="$slug" npm run build > "$LOG_DIR/build-${slug}.log" 2>&1; then
    echo "✓ OK"
    ((SUCCESS++)) || true
  else
    echo "✗ FALHOU"
    FAILED_SITES="$FAILED_SITES $slug"
    ((FAIL++)) || true
    # Mostrar últimas 10 linhas do log de erro
    echo "    ── últimas 10 linhas ──"
    tail -10 "$LOG_DIR/build-${slug}.log" | sed 's/^/    /'
    echo "    ── fim ──"
  fi
done

echo ""
echo "━━━ Resultado ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ Sucesso: $SUCCESS"
echo " ✗ Falha:   $FAIL"
[ -n "$FAILED_SITES" ] && echo " Sites com falha:$FAILED_SITES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Gerar TASK-1-BUILD-REPORT.md
TOTAL=$((SUCCESS + FAIL))
VERDICT="APROVADO"
[ $FAIL -gt 0 ] && VERDICT="REPROVADO"

cat > "$REPORT" << MDEOF
# TASK-1: Build Report — $(date '+%Y-%m-%d %H:%M')

## Resultado

- Sites processados: ${TOTAL}
- Sites buildados com sucesso: ${SUCCESS}/${TOTAL}
- Sites com falha: ${FAIL}
- Modo dry-run: ${DRY_RUN}

## Sites com falha

${FAILED_SITES:-"Nenhum — todos os sites buildaram com sucesso ✓"}

## TypeScript

Executar separadamente: \`npx tsc --noEmit\`
Resultado: Ver build-typescript-errors.log

## Veredito

**${VERDICT}** — $([ $FAIL -eq 0 ] && echo "✓ Todos os ${SUCCESS} sites buildados com sucesso" || echo "✗ ${FAIL} sites falharam no build")

## Logs

Logs de build individuais: \`/tmp/micro-sites-build-logs/build-{slug}.log\`
MDEOF

echo ""
echo "Relatório gravado em: $REPORT"

# Criar marker se aprovado
[ $FAIL -eq 0 ] && touch "$INTEGRATION_DIR/.task1-successful"

exit $FAIL
