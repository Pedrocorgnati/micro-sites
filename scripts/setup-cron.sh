#!/bin/bash
# =============================================================================
# setup-cron.sh — Agendador de jobs de monitoramento
#
# Configura cron jobs para todos os jobs de monitoramento da rede:
#   1. Lighthouse mensal — dia 1 de cada mês às 08:00
#   2. Verificação Static Forms — toda segunda-feira às 09:00 (lembrete)
#   3. Content freshness trimestral — dia 1 de jan/abr/jul/out às 09:00
#
# Uso:
#   ./scripts/setup-cron.sh                          # usa diretório atual
#   ./scripts/setup-cron.sh /caminho/absoluto/projeto
#
# O que faz:
#   - Valida que scripts existem e são executáveis
#   - Cria diretório de logs se necessário
#   - Adiciona entradas ao crontab (idempotente — não duplica)
#
# Remover todos os jobs:
#   crontab -l | grep -v "micro-sites" | crontab -
#
# Fonte: module-13-monitoramento + TASK-11 ST004
# =============================================================================

set -o pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="${1:-.}"
PROJECT_ROOT=$(realpath "$PROJECT_ROOT" 2>/dev/null || echo "$PROJECT_ROOT")

LH_SCRIPT="${PROJECT_ROOT}/scripts/lighthouse-monthly.sh"
FRESHNESS_SCRIPT="${PROJECT_ROOT}/scripts/check-content-freshness.sh"
METRICS_SCRIPT="${PROJECT_ROOT}/scripts/metrics/run-monthly.sh"
BLOG_MONTHLY_SCRIPT="${PROJECT_ROOT}/scripts/blog-monthly-cron.sh"
LOG_DIR="${PROJECT_ROOT}/logs"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Setup Cron — Monitoramento Micro Sites                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Project root: $PROJECT_ROOT"
echo ""

# Criar diretório de logs
mkdir -p "$LOG_DIR"
echo -e "${GREEN}✓${NC} Diretório de logs: $LOG_DIR"
echo ""

# Tornar scripts executáveis
for script in "$LH_SCRIPT" "$FRESHNESS_SCRIPT"; do
  if [[ -f "$script" && ! -x "$script" ]]; then
    chmod +x "$script"
    echo -e "${YELLOW}⚠${NC} chmod +x: $script"
  fi
done

# ---------------------------------------------------------------------------
# Definir entradas de cron
# ---------------------------------------------------------------------------

# 1. Lighthouse CI — dia 1 de cada mês às 08:00
CRON_LH="0 8 1 * * ${LH_SCRIPT} >> ${LOG_DIR}/lighthouse.log 2>&1 # micro-sites lighthouse"

# 2. Static Forms check — toda segunda-feira às 09:00 (lembrete no log)
CRON_SF="0 9 * * 1 echo \"[LEMBRETE] Verificar dashboard Static Forms: https://staticforms.xyz/dashboard\" >> ${LOG_DIR}/static-forms.log 2>&1 # micro-sites static-forms"

# 3. Content freshness — dia 1 de jan/abr/jul/out às 09:00
#    TASK-11 / CL-260: output vira checklist trimestral com data em
#    ${LOG_DIR}/refresh-checklist-YYYY-QN.md (primeiro dia util do trimestre)
CRON_FRESH_CMD="${FRESHNESS_SCRIPT} 2>&1 | tee -a ${LOG_DIR}/freshness.log > ${LOG_DIR}/refresh-checklist-\$(date +\%Y)-Q\$(( (\$(date +\%-m)-1)/3 + 1 )).md"
CRON_FRESH="0 9 1 1,4,7,10 * ${CRON_FRESH_CMD} # micro-sites freshness"

# 4. Metrics monthly — dia 1 de cada mês às 09:00 (GSC + GA4 + leads + aggregate)
CRON_METRICS="0 9 1 * * ${METRICS_SCRIPT} >> ${LOG_DIR}/metrics.log 2>&1 # micro-sites metrics"

# 5. Blog monthly batch — dia 1 de cada mes as 10:00
CRON_BLOG="0 10 1 * * ${BLOG_MONTHLY_SCRIPT} >> ${LOG_DIR}/blog-monthly.log 2>&1 # micro-sites blog-monthly"

# ---------------------------------------------------------------------------
# Registrar cron jobs (idempotente)
# ---------------------------------------------------------------------------

ADDED=0

register_cron() {
  local label="$1"
  local key="$2"
  local entry="$3"

  if crontab -l 2>/dev/null | grep -q "$key"; then
    echo -e "${YELLOW}⚠${NC} Cron '$label' já existe — ignorado"
  else
    (crontab -l 2>/dev/null; echo "$entry") | crontab -
    echo -e "${GREEN}✓${NC} Cron registrado: $label"
    ADDED=$((ADDED + 1))
  fi
}

register_cron "Lighthouse mensal" "micro-sites lighthouse" "$CRON_LH"
register_cron "Static Forms semanal" "micro-sites static-forms" "$CRON_SF"
register_cron "Content freshness trimestral" "micro-sites freshness" "$CRON_FRESH"
register_cron "Metrics mensal (GSC+GA4+leads)" "micro-sites metrics" "$CRON_METRICS"
register_cron "Blog monthly batch" "micro-sites blog-monthly" "$CRON_BLOG"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup concluído — $ADDED novo(s) job(s) registrado(s)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Jobs ativos:"
crontab -l 2>/dev/null | grep "micro-sites" || echo "  (nenhum encontrado)"
echo ""
