#!/bin/bash
# =============================================================================
# lighthouse-monthly.sh — Auditoria Lighthouse mensal de 8 sites amostrados
#
# Executa auditoria de performance, SEO e acessibilidade em uma amostra
# representativa de 8 sites (1 por categoria), salva relatórios JSON mensais
# e emite alertas se scores estiverem abaixo dos thresholds.
#
# Agendamento: Cron dia 1 de cada mês às 08:00
#   0 8 1 * * /path/to/scripts/lighthouse-monthly.sh >> /path/to/logs/lighthouse.log 2>&1
#
# Uso:
#   ./scripts/lighthouse-monthly.sh
#   DOMAIN=meudominio.com.br ./scripts/lighthouse-monthly.sh
#   SAMPLE="a01 d01" ./scripts/lighthouse-monthly.sh   # amostra customizada
#
# Pré-requisitos:
#   - npx disponível (Node.js 18+)
#   - Chrome/Chromium instalado
#     (instalar: npx puppeteer browsers install chrome)
#
# Saída:
#   docs/lighthouse/{YYYY-MM}/lighthouse-{slug}.json   relatórios completos
#   exit code 0 — todos os sites auditados com sucesso
#   exit code 1 — uma ou mais falhas críticas
#
# Fonte: module-13-monitoramento/TASK-2/ST001
# Guardrail: PERF-005 (score ≥ 90 em todas as categorias)
# =============================================================================

set -o pipefail

# Cores (desabilitadas se não for terminal)
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' NC=''
fi

# =============================================================================
# CONFIGURAÇÃO
# =============================================================================

DOMAIN="${DOMAIN:-DOMAIN.com}"
MONTH=$(date +%Y-%m)
REPORT_DIR="docs/lighthouse/${MONTH}"
LOG_PREFIX="[$(date +'%Y-%m-%d %H:%M:%S')]"

# Thresholds (PERF-005 / TASK-0 Micro-HLD)
THRESHOLD_PERF="${THRESHOLD_PERF:-90}"
THRESHOLD_SEO="${THRESHOLD_SEO:-90}"
THRESHOLD_A11Y="${THRESHOLD_A11Y:-85}"

# Amostra: 8 sites — 1 representativo por categoria (a, b, c×2, d×2, e, f)
# c06 e d03 adicionados para cross-check inter-categoria
SAMPLE="${SAMPLE:-a01 b01 c01 c06 d01 d03 e01 f01}"

FAILED_COUNT=0
ALERTED_COUNT=0
TOTAL_AUDITED=0

# =============================================================================
# PRÉ-REQUISITOS
# =============================================================================

validate_prerequisites() {
  # Criar diretório de relatórios
  mkdir -p "$REPORT_DIR"
  mkdir -p logs

  # Verificar npx
  if ! command -v npx &>/dev/null; then
    echo "${LOG_PREFIX} ✗ ERRO: npx não encontrado. Instale Node.js 18+."
    exit 1
  fi

  # Verificar se lighthouse está disponível
  if ! npx lighthouse --version &>/dev/null 2>&1; then
    echo "${LOG_PREFIX} ✗ ERRO: Lighthouse não disponível via npx."
    echo "${LOG_PREFIX}   Instale: npm install -g lighthouse"
    echo "${LOG_PREFIX}   Ou: npx lighthouse --help (instala automaticamente)"
    exit 1
  fi

  echo "${LOG_PREFIX} Lighthouse: $(npx lighthouse --version 2>/dev/null)"
}

# =============================================================================
# EXTRAIR SCORE DE RELATÓRIO JSON
# =============================================================================

extract_score() {
  local json_file="$1"
  local category="$2"   # performance | seo | accessibility | best-practices

  if command -v node &>/dev/null && [ -f "$json_file" ]; then
    node -e "
      try {
        const r = require('./${json_file}');
        const cats = r.lhr?.categories || r.categories || {};
        const cat = cats['${category}'] || cats['${category}'.replace('best-practices', 'best-practices')] || {};
        const score = cat.score;
        console.log(score !== null && score !== undefined ? Math.round(score * 100) : 'N/A');
      } catch(e) {
        console.log('ERROR');
      }
    " 2>/dev/null
  elif command -v jq &>/dev/null && [ -f "$json_file" ]; then
    jq -r ".lhr.categories[\"${category}\"].score // .categories[\"${category}\"].score // \"null\"" \
      "$json_file" 2>/dev/null | \
      awk '{ if ($1 ~ /^[0-9.]+$/) printf "%d\n", $1 * 100; else print "N/A" }'
  else
    echo "N/A"
  fi
}

# =============================================================================
# AUDITAR UM SITE
# =============================================================================

audit_site() {
  local slug="$1"
  local url="https://${slug}.${DOMAIN}"
  local output_file="${REPORT_DIR}/lighthouse-${slug}.json"

  echo ""
  echo "${LOG_PREFIX} Auditando ${slug} → ${url}"

  # Executar Lighthouse com timeout de 5 minutos por site
  if timeout 300 npx lighthouse "$url" \
    --output=json \
    --output-path="$output_file" \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
    --quiet \
    --only-categories=performance,seo,accessibility,best-practices \
    2>/dev/null; then

    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
      local perf seo a11y bp
      perf=$(extract_score "$output_file" "performance")
      seo=$(extract_score "$output_file" "seo")
      a11y=$(extract_score "$output_file" "accessibility")
      bp=$(extract_score "$output_file" "best-practices")

      echo -e "${LOG_PREFIX}   ${GREEN}✓${NC} ${slug}: Performance=${perf} SEO=${seo} A11y=${a11y} BestPractices=${bp}"
      TOTAL_AUDITED=$((TOTAL_AUDITED + 1))

      # Verificar thresholds (PERF-005)
      # Performance — Cat D tem threshold 85
      local perf_threshold="$THRESHOLD_PERF"
      if [[ "$slug" == d* ]]; then
        perf_threshold=85
      fi

      if [ "$perf" != "N/A" ] && [ "$perf" != "ERROR" ] && [ "$perf" -lt "$perf_threshold" ] 2>/dev/null; then
        echo -e "${LOG_PREFIX}   ${YELLOW}⚠ ALERTA:${NC} Performance ${slug} abaixo de ${perf_threshold} (atual: ${perf})"
        ALERTED_COUNT=$((ALERTED_COUNT + 1))
      fi
      if [ "$seo" != "N/A" ] && [ "$seo" != "ERROR" ] && [ "$seo" -lt "$THRESHOLD_SEO" ] 2>/dev/null; then
        echo -e "${LOG_PREFIX}   ${YELLOW}⚠ ALERTA:${NC} SEO ${slug} abaixo de ${THRESHOLD_SEO} (atual: ${seo})"
        ALERTED_COUNT=$((ALERTED_COUNT + 1))
      fi
      if [ "$a11y" != "N/A" ] && [ "$a11y" != "ERROR" ] && [ "$a11y" -lt "$THRESHOLD_A11Y" ] 2>/dev/null; then
        echo -e "${LOG_PREFIX}   ${YELLOW}⚠ ALERTA:${NC} A11y ${slug} abaixo de ${THRESHOLD_A11Y} (atual: ${a11y})"
        ALERTED_COUNT=$((ALERTED_COUNT + 1))
      fi

    else
      echo -e "${LOG_PREFIX}   ${RED}✗${NC} Relatório JSON não gerado para ${slug}"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

  else
    local exit_code=$?
    if [ "$exit_code" -eq 124 ]; then
      echo -e "${LOG_PREFIX}   ${RED}✗${NC} TIMEOUT (>300s) ao auditar ${slug}"
    else
      echo -e "${LOG_PREFIX}   ${RED}✗${NC} Erro ao auditar ${slug} (exit code: ${exit_code})"
    fi
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi

  # Rate limit: aguardar 1s entre auditorias para não sobrecarregar o servidor
  sleep 1
}

# =============================================================================
# MAIN
# =============================================================================

main() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║     Lighthouse CI Mensal — Rede Micro Sites                ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo "${LOG_PREFIX} Mês: $MONTH | Domínio: $DOMAIN"
  echo "${LOG_PREFIX} Amostra: $SAMPLE"
  echo "${LOG_PREFIX} Thresholds: Perf≥${THRESHOLD_PERF} SEO≥${THRESHOLD_SEO} A11y≥${THRESHOLD_A11Y}"
  echo "${LOG_PREFIX} Relatórios: ${REPORT_DIR}/"
  echo ""

  validate_prerequisites

  # Auditar cada site da amostra
  for slug in $SAMPLE; do
    audit_site "$slug"
  done

  # Resumo final
  local total_expected
  total_expected=$(echo "$SAMPLE" | wc -w)
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "RESUMO — Auditoria Mensal $MONTH"
  echo "════════════════════════════════════════════════════════════"
  echo "  Sites na amostra:      $total_expected"
  echo "  Sites auditados:       $TOTAL_AUDITED"
  echo -e "  ${RED}Falhas:${NC}               $FAILED_COUNT"
  echo -e "  ${YELLOW}Alertas (threshold):${NC}  $ALERTED_COUNT"
  echo "  Relatórios em:         ${REPORT_DIR}/"
  echo ""

  if [ "$ALERTED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ $ALERTED_COUNT ALERTA(S) DE THRESHOLD DETECTADOS.${NC}"
    echo "  Revisar manualmente e aplicar correções."
    echo "  Ver: docs/MONITORING-RUNBOOK.md § 2 (Lighthouse Performance < 90)"
  fi

  if [ "$FAILED_COUNT" -gt 0 ]; then
    echo -e "${RED}✗ $FAILED_COUNT FALHA(S) CRÍTICAS.${NC}"
    echo "  Sites inacessíveis ou Chrome não disponível."
    echo "  Verificar: DOMAIN=$DOMAIN | npx lighthouse --version"
    exit 1
  fi

  if [ "$ALERTED_COUNT" -eq 0 ] && [ "$FAILED_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ Auditoria concluída — todos os sites dentro dos thresholds.${NC}"
  fi

  exit 0
}

main "$@"
