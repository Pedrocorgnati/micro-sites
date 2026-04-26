#!/bin/bash
# =============================================================================
# validate-sites-health.sh — Pré-requisito de monitoramento
#
# Valida que todos os 36 sites respondem com HTTP 200 antes de ativar
# os monitores de uptime e configurar o monitoramento de performance.
#
# Uso:
#   ./scripts/validate-sites-health.sh
#   TIMEOUT=15 ./scripts/validate-sites-health.sh    # timeout customizado
#
# Saída:
#   docs/pre-monitoring-health.txt — relatório com status de cada site
#   exit code 0 — todos os sites OK
#   exit code 1 — um ou mais sites falharam
#
# Pré-requisitos:
#   - jq instalado (para ler sites-monitoring.json)
#   - curl instalado
#   - config/sites-monitoring.json existe
#
# Fonte: module-13-monitoramento/TASK-0/ST003
# Guardrail: INFRA-006
# =============================================================================

set -o pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONFIG="config/sites-monitoring.json"
HEALTH_REPORT="docs/pre-monitoring-health.txt"
TIMEOUT="${TIMEOUT:-10}"
FAILED_COUNT=0
OK_COUNT=0

# Validar pré-requisitos
if ! command -v jq &>/dev/null; then
  echo -e "${RED}✗ Erro: jq não encontrado. Instale: apt install jq | brew install jq${NC}"
  exit 1
fi

if [ ! -f "$CONFIG" ]; then
  echo -e "${RED}✗ Erro: $CONFIG não encontrado.${NC}"
  echo "  Execute este script a partir da raiz do projeto."
  exit 1
fi

mkdir -p docs

# Inicializar relatório
REPORT_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
{
  echo "# Relatório de Health Check — Pré-Monitoramento"
  echo "# Data: $REPORT_DATE"
  echo "# Config: $CONFIG"
  echo "# Timeout por request: ${TIMEOUT}s"
  echo "# ─────────────────────────────────────────────"
  echo ""
} > "$HEALTH_REPORT"

TOTAL=$(jq '.sites | length' "$CONFIG")

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Validate Sites Health — Pré-Requisito de Monitoramento  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Data: $REPORT_DATE"
echo "Sites a verificar: $TOTAL"
echo "Relatório: $HEALTH_REPORT"
echo ""

# Iterar sobre todos os sites
CURRENT=0
while IFS= read -r site_json; do
  CURRENT=$((CURRENT + 1))
  SLUG=$(echo "$site_json" | jq -r '.slug')
  DOMAIN=$(echo "$site_json" | jq -r '.domain')
  HEALTH_PATH=$(echo "$site_json" | jq -r '.healthCheckPath // "/"')
  URL="${DOMAIN}${HEALTH_PATH}"

  # Normalizar URL (evitar double slash)
  URL=$(echo "$URL" | sed 's|/$||; s|//|/|g; s|:/|://|g')

  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  printf "[%02d/%02d] %-6s → %-45s" "$CURRENT" "$TOTAL" "$SLUG" "$URL"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time "$TIMEOUT" \
    --connect-timeout 5 \
    -L \
    "$URL" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e " ${GREEN}✓${NC} HTTP $HTTP_CODE"
    echo "✓ $SLUG $URL [HTTP $HTTP_CODE] $TIMESTAMP" >> "$HEALTH_REPORT"
    OK_COUNT=$((OK_COUNT + 1))
  elif [ "$HTTP_CODE" = "000" ]; then
    echo -e " ${RED}✗${NC} TIMEOUT (>${TIMEOUT}s)"
    echo "✗ $SLUG $URL [TIMEOUT] $TIMESTAMP — FALHA: site não responde em ${TIMEOUT}s" >> "$HEALTH_REPORT"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  else
    echo -e " ${RED}✗${NC} HTTP $HTTP_CODE"
    echo "✗ $SLUG $URL [HTTP $HTTP_CODE] $TIMESTAMP — FALHA DE PRÉ-REQUISITO" >> "$HEALTH_REPORT"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi

done < <(jq -c '.sites[]' "$CONFIG")

# Resumo
echo "" >> "$HEALTH_REPORT"
echo "# ─────────────────────────────────────────────" >> "$HEALTH_REPORT"
echo "# RESUMO: OK=$OK_COUNT | FALHA=$FAILED_COUNT | TOTAL=$TOTAL" >> "$HEALTH_REPORT"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "RESUMO"
echo "════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✓ OK:${NC}    $OK_COUNT sites"
echo -e "  ${RED}✗ Falha:${NC} $FAILED_COUNT sites"
echo "  Total:   $TOTAL sites"
echo ""
echo "Relatório completo: $HEALTH_REPORT"
echo ""

if [ "$FAILED_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠ ALERTA: $FAILED_COUNT site(s) não respondendo.${NC}"
  echo "  Aguarde os deployments de module-6 a module-10 antes de prosseguir."
  echo "  Consulte o runbook: docs/MONITORING-RUNBOOK.md"
  exit 1
fi

echo -e "${GREEN}✅ Todos os $TOTAL sites respondendo corretamente.${NC}"
echo "   Pré-requisito de monitoramento APROVADO."
echo "   Próximo passo: ./scripts/setup-uptime-monitors.sh"
exit 0
