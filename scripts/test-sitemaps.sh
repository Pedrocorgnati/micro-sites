#!/bin/bash
# =============================================================================
# TEST SITEMAPS — Valida acessibilidade dos sitemaps de 36 micro-sites
#
# Uso:
#   ./scripts/test-sitemaps.sh                    # Modo de verificação rápida
#   DOMAIN=meudominio.com ./scripts/test-sitemaps.sh
#   ./scripts/test-sitemaps.sh meudominio.com
#
# Exit code: 0 se todos passam, 1 se algum falha
# =============================================================================

set -o pipefail

# Parse args
DOMAIN="${1:-${DOMAIN:-DOMAIN.com}}"
TIMEOUT=10
REPORT_FILE="docs/sitemap-test-$(date +%Y%m%d-%H%M%S).log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ALL_SLUGS=(
  a01 a02 a03 a04 a05 a06 a07 a08 a09 a10
  b01 b02 b03 b04 b05 b06 b07 b08
  c01 c02 c03 c04 c05 c06 c07 c08
  d01 d02 d03 d04 d05
  e01 e02 e03
  f01 f02
)

SUCCESS=0
FAILED=0
FAILED_SITES=()

mkdir -p "$(dirname "$REPORT_FILE")"

echo "=== TESTE DE ACESSIBILIDADE DE SITEMAPS ===" | tee "$REPORT_FILE"
echo "Domínio: $DOMAIN" | tee -a "$REPORT_FILE"
echo "Data: $(date)" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

for slug in "${ALL_SLUGS[@]}"; do
  SITEMAP_URL="https://${slug}.${DOMAIN}/sitemap.xml"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$SITEMAP_URL" 2>/dev/null)

  if [ "$STATUS" = "200" ]; then
    SIZE=$(curl -s --max-time "$TIMEOUT" "$SITEMAP_URL" 2>/dev/null | wc -c)
    echo -e "${GREEN}✓${NC} ${slug}: sitemap OK (HTTP $STATUS, ~${SIZE} bytes)" | tee -a "$REPORT_FILE"
    ((SUCCESS++))
  elif [ "$STATUS" = "000" ]; then
    echo -e "${YELLOW}⚠${NC} ${slug}: timeout ou DNS não resolvido (${SITEMAP_URL})" | tee -a "$REPORT_FILE"
    ((FAILED++))
    FAILED_SITES+=("$slug: timeout/DNS")
  else
    echo -e "${RED}✗${NC} ${slug}: sitemap FALHOU (HTTP $STATUS)" | tee -a "$REPORT_FILE"
    ((FAILED++))
    FAILED_SITES+=("$slug: HTTP $STATUS")
  fi
done

echo "" | tee -a "$REPORT_FILE"
echo "=== RESUMO ===" | tee -a "$REPORT_FILE"
echo "Sucesso: $SUCCESS / ${#ALL_SLUGS[@]}" | tee -a "$REPORT_FILE"
echo "Falha: $FAILED / ${#ALL_SLUGS[@]}" | tee -a "$REPORT_FILE"
echo "Log: $REPORT_FILE" | tee -a "$REPORT_FILE"

if [ "${#FAILED_SITES[@]}" -gt 0 ]; then
  echo "" | tee -a "$REPORT_FILE"
  echo "SITES COM FALHA:" | tee -a "$REPORT_FILE"
  for s in "${FAILED_SITES[@]}"; do
    echo "  ✗ $s" | tee -a "$REPORT_FILE"
  done
fi

if [ "$FAILED" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠ AÇÃO NECESSÁRIA: Verificar deploy e revalidar $FAILED sites.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Todos os ${#ALL_SLUGS[@]} sitemaps estão acessíveis.${NC}"
exit 0
