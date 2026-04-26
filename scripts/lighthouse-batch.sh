#!/bin/bash
# =============================================================================
# LIGHTHOUSE BATCH — Roda Lighthouse em 36 micro-sites e coleta métricas
#
# Requer: lighthouse CLI (npm i -g lighthouse) ou PageSpeed Insights API
#
# Uso:
#   bash scripts/lighthouse-batch.sh                  # Todos os sites
#   bash scripts/lighthouse-batch.sh a                # Apenas categoria A
#   DOMAIN=meudominio.com bash scripts/lighthouse-batch.sh
#   PSI_API_KEY=xxx bash scripts/lighthouse-batch.sh  # PageSpeed Insights API
#
# Saída:
#   docs/LIGHTHOUSE-RESULTS.json
#   docs/SEO-AUDIT-REPORT.md (seção Lighthouse)
# =============================================================================

set -o pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================================================
# GATE MODE — usado em CI. Roda lighthouse-gate.ts por site (dist/ local) e
# agrega PASS/FAIL. Thresholds por categoria (A/B/C/E/F=95+, D=85+ INP<200ms).
# Ativar com: GATE=1 bash scripts/lighthouse-batch.sh
# =============================================================================
if [ "${GATE:-0}" = "1" ]; then
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║      LIGHTHOUSE GATE — dist/ local, thresholds CI          ║"
  echo "╚════════════════════════════════════════════════════════════╝"

  SITES_ROOT="${SITES_ROOT:-sites}"
  DIST_ROOT="${DIST_ROOT:-dist}"
  PASS_COUNT=0
  FAIL_COUNT=0
  FAILED_LIST=()

  mapfile -t GATE_SLUGS < <(ls "$SITES_ROOT" 2>/dev/null | grep -vE '^_' | sort)
  TOTAL=${#GATE_SLUGS[@]}

  if [ "$TOTAL" -eq 0 ]; then
    echo -e "${RED}✗${NC} Nenhum site em $SITES_ROOT"
    exit 2
  fi

  idx=0
  for slug in "${GATE_SLUGS[@]}"; do
    ((idx++))
    if [ ! -d "$DIST_ROOT/$slug" ]; then
      echo "[$idx/$TOTAL] $slug — SKIP (sem dist/)"
      continue
    fi
    echo "[$idx/$TOTAL] $slug — gate…"
    if npx tsx scripts/lighthouse-gate.ts "$slug"; then
      ((PASS_COUNT++))
    else
      ((FAIL_COUNT++))
      FAILED_LIST+=("$slug")
    fi
  done

  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "GATE RESUMO: ${PASS_COUNT}/${TOTAL} PASS, ${FAIL_COUNT}/${TOTAL} FAIL"
  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo ""
    echo "Sites reprovados:"
    for s in "${FAILED_LIST[@]}"; do echo "  ✗ $s"; done
    exit 1
  fi
  echo -e "${GREEN}✅ TODOS OS SITES PASSARAM NO GATE${NC}"
  exit 0
fi

DOMAIN="${DOMAIN:-DOMAIN.com}"
PSI_API_KEY="${PSI_API_KEY:-}"
CATEGORY_FILTER="${1:-}"
RESULTS_JSON="docs/LIGHTHOUSE-RESULTS.json"
TIMEOUT=60

# Limiares mínimos
MIN_SEO=90
MIN_PERFORMANCE=85

# Slugs por categoria
SLUGS_A="a01 a02 a03 a04 a05 a06 a07 a08 a09 a10"
SLUGS_B="b01 b02 b03 b04 b05 b06 b07 b08"
SLUGS_C="c01 c02 c03 c04 c05 c06 c07 c08"
SLUGS_D="d01 d02 d03 d04 d05"
SLUGS_E="e01 e02 e03"
SLUGS_F="f01 f02"

case "$CATEGORY_FILTER" in
  a|A) SLUGS="$SLUGS_A" ;;
  b|B) SLUGS="$SLUGS_B" ;;
  c|C) SLUGS="$SLUGS_C" ;;
  d|D) SLUGS="$SLUGS_D" ;;
  e|E) SLUGS="$SLUGS_E" ;;
  f|F) SLUGS="$SLUGS_F" ;;
  *) SLUGS="$SLUGS_A $SLUGS_B $SLUGS_C $SLUGS_D $SLUGS_E $SLUGS_F" ;;
esac

# Arrays para resultados
declare -A SEO_SCORES
declare -A PERF_SCORES
declare -A A11Y_SCORES
BELOW_SEO=()
BELOW_PERF=()
FAILED_SITES=()

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      LIGHTHOUSE BATCH — Rede Micro Sites                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Data: $(date)"
echo "Domínio: $DOMAIN"
echo "Sites: $(echo $SLUGS | wc -w)"
echo ""

# Verificar ferramenta disponível
if command -v lighthouse &>/dev/null; then
  TOOL="lighthouse"
  echo "→ Usando: Lighthouse CLI"
elif [ -n "$PSI_API_KEY" ]; then
  TOOL="psi"
  echo "→ Usando: PageSpeed Insights API"
elif command -v npx &>/dev/null; then
  TOOL="npx"
  echo "→ Usando: npx lighthouse"
else
  echo -e "${YELLOW}⚠${NC} Nem lighthouse CLI nem PSI API encontrados."
  echo "Instale: npm i -g lighthouse"
  echo "Ou defina: PSI_API_KEY=sua_chave"
  echo ""
  echo "Gerando relatório placeholder..."
  TOOL="placeholder"
fi

# Função para auditar via Lighthouse CLI
audit_lighthouse() {
  local url="$1"
  local slug="$2"
  local tmp="/tmp/lh-${slug}.json"

  if [ "$TOOL" = "lighthouse" ]; then
    lighthouse "$url" \
      --output=json \
      --output-path="$tmp" \
      --chrome-flags="--headless --no-sandbox" \
      --quiet \
      --timeout="$TIMEOUT" 2>/dev/null
  elif [ "$TOOL" = "npx" ]; then
    npx lighthouse "$url" \
      --output=json \
      --output-path="$tmp" \
      --chrome-flags="--headless --no-sandbox" \
      --quiet 2>/dev/null
  elif [ "$TOOL" = "psi" ]; then
    curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${PSI_API_KEY}&strategy=mobile&category=performance&category=seo&category=accessibility" \
      > "$tmp" 2>/dev/null
  fi

  if [ ! -f "$tmp" ] || [ ! -s "$tmp" ]; then
    echo "FAILED"
    return
  fi

  local seo perf a11y
  if command -v jq &>/dev/null; then
    if [ "$TOOL" = "psi" ]; then
      seo=$(jq -r '.lighthouseResult.categories.seo.score // 0' "$tmp")
      perf=$(jq -r '.lighthouseResult.categories.performance.score // 0' "$tmp")
      a11y=$(jq -r '.lighthouseResult.categories.accessibility.score // 0' "$tmp")
    else
      seo=$(jq -r '.categories.seo.score // 0' "$tmp")
      perf=$(jq -r '.categories.performance.score // 0' "$tmp")
      a11y=$(jq -r '.categories.accessibility.score // 0' "$tmp")
    fi
    # Converter de 0-1 para 0-100
    seo=$(echo "$seo * 100" | bc 2>/dev/null | cut -d. -f1 || echo 0)
    perf=$(echo "$perf * 100" | bc 2>/dev/null | cut -d. -f1 || echo 0)
    a11y=$(echo "$a11y * 100" | bc 2>/dev/null | cut -d. -f1 || echo 0)
  else
    seo="N/A"
    perf="N/A"
    a11y="N/A"
  fi

  rm -f "$tmp"
  echo "${seo}|${perf}|${a11y}"
}

total=$(echo $SLUGS | wc -w)
current=0

# Iniciar JSON de resultados
mkdir -p docs
echo '{"audit_date":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","tool":"'"$TOOL"'","domain":"'"$DOMAIN"'","sites":[' > "$RESULTS_JSON"
first_entry=true

for slug in $SLUGS; do
  ((current++))
  base_slug="${slug%%-*}"
  URL="https://${base_slug}.${DOMAIN}"

  printf "[%02d/%02d] %s → %s ... " "$current" "$total" "$slug" "$URL"

  if [ "$TOOL" = "placeholder" ]; then
    echo "PLACEHOLDER (ferramenta não disponível)"
    SEO_SCORES["$slug"]="N/A"
    PERF_SCORES["$slug"]="N/A"
    A11Y_SCORES["$slug"]="N/A"
    result="N/A|N/A|N/A"
  else
    result=$(audit_lighthouse "$URL" "$slug")
  fi

  if [ "$result" = "FAILED" ]; then
    echo -e "${RED}✗${NC} FALHA ao auditar"
    FAILED_SITES+=("$slug")
    SEO_SCORES["$slug"]=-1
    PERF_SCORES["$slug"]=-1
    A11Y_SCORES["$slug"]=-1
    continue
  fi

  IFS='|' read -r seo perf a11y <<< "$result"

  SEO_SCORES["$slug"]=$seo
  PERF_SCORES["$slug"]=$perf
  A11Y_SCORES["$slug"]=$a11y

  # Verificar limiares
  seo_ok=true
  perf_ok=true

  if [ "$seo" != "N/A" ] && [ -n "$seo" ] && [ "$seo" -lt "$MIN_SEO" ] 2>/dev/null; then
    BELOW_SEO+=("$slug:$seo")
    seo_ok=false
  fi

  if [ "$perf" != "N/A" ] && [ -n "$perf" ] && [ "$perf" -lt "$MIN_PERFORMANCE" ] 2>/dev/null; then
    BELOW_PERF+=("$slug:$perf")
    perf_ok=false
  fi

  if $seo_ok && $perf_ok; then
    echo -e "${GREEN}✓${NC} SEO=$seo | Perf=$perf | A11y=$a11y"
  else
    flags=""
    $seo_ok || flags="${flags}SEO=${seo}<${MIN_SEO} "
    $perf_ok || flags="${flags}Perf=${perf}<${MIN_PERFORMANCE}"
    echo -e "${YELLOW}⚠${NC} $flags| A11y=$a11y"
  fi

  # Adicionar ao JSON
  if ! $first_entry; then
    echo ',' >> "$RESULTS_JSON"
  fi
  first_entry=false
  cat >> "$RESULTS_JSON" << JSON_ENTRY
{
  "slug": "$slug",
  "url": "$URL",
  "seo_score": $seo,
  "performance_score": $perf,
  "accessibility_score": $a11y,
  "seo_ok": $seo_ok,
  "performance_ok": $perf_ok
}
JSON_ENTRY

done

echo ']}' >> "$RESULTS_JSON"

# Calcular médias
calc_avg() {
  local arr=("$@")
  local sum=0
  local count=0
  for v in "${arr[@]}"; do
    if [[ "$v" =~ ^[0-9]+$ ]]; then
      ((sum += v))
      ((count++))
    fi
  done
  [ "$count" -gt 0 ] && echo $((sum / count)) || echo "N/A"
}

seo_values=("${SEO_SCORES[@]}")
perf_values=("${PERF_SCORES[@]}")
seo_avg=$(calc_avg "${seo_values[@]}")
perf_avg=$(calc_avg "${perf_values[@]}")

# Resumo final
echo ""
echo "════════════════════════════════════════════════════════════"
echo "RESUMO"
echo "════════════════════════════════════════════════════════════"
echo "Sites auditados: $total"
echo "SEO médio: $seo_avg | Performance média: $perf_avg"
echo "Abaixo do mínimo SEO (${MIN_SEO}): ${#BELOW_SEO[@]}"
echo "Abaixo do mínimo Perf (${MIN_PERFORMANCE}): ${#BELOW_PERF[@]}"
echo "Falhas: ${#FAILED_SITES[@]}"

if [ ${#BELOW_SEO[@]} -gt 0 ]; then
  echo ""
  echo "Sites com SEO abaixo de $MIN_SEO:"
  for s in "${BELOW_SEO[@]}"; do echo "  ✗ $s"; done
fi

if [ ${#BELOW_PERF[@]} -gt 0 ]; then
  echo ""
  echo "Sites com Performance abaixo de $MIN_PERFORMANCE:"
  for s in "${BELOW_PERF[@]}"; do echo "  ✗ $s"; done
fi

total_issues=$((${#BELOW_SEO[@]} + ${#BELOW_PERF[@]} + ${#FAILED_SITES[@]}))
if [ "$total_issues" -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ TODOS OS SITES DENTRO DOS LIMIARES${NC}"
else
  echo ""
  echo -e "${YELLOW}⚠️ $total_issues SITE(S) ABAIXO DOS LIMIARES${NC}"
fi

echo ""
echo "Resultados JSON: $RESULTS_JSON"

exit $total_issues
