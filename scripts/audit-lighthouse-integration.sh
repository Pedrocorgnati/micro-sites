#!/bin/bash
# scripts/audit-lighthouse-integration.sh
# Lighthouse batch — amostra de 10 sites (modo local via serve)
# TASK-2: module-14-integration-e-auditoria
#
# Uso:
#   bash scripts/audit-lighthouse-integration.sh
#   DOMAIN=meudominio.com bash scripts/audit-lighthouse-integration.sh  # produção

set -uo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$WORKSPACE/dist"
INTEGRATION_DIR="$(cd "$WORKSPACE/../../.." && pwd)/output/docs/micro-sites/integration"
LH_DIR="$INTEGRATION_DIR/lighthouse"
REPORT_MD="$INTEGRATION_DIR/TASK-2-LIGHTHOUSE-REPORT.md"
SCORECARD="$INTEGRATION_DIR/PERFORMANCE-SCORECARD.md"
DOMAIN="${DOMAIN:-}"
PORT=18080

mkdir -p "$LH_DIR"

# Amostra: 2 por categoria + criticos Cat. D
# short_slug -> dist_dir_suffix
declare -A SLUG_MAP
SLUG_MAP=(
  [a01]="a01"
  [a07]="a07"
  [b01]="b01-sem-site-profissional"
  [b04]="b04-sem-presenca-digital"
  [c01]="c01-site-institucional-pme"
  [c06]="c06-automacao-atendimento"
  [d01]="d01-calculadora-custo-site"
  [d03]="d03-diagnostico-maturidade-digital"
  [e01]="e01-ia-para-pequenos-negocios"
  [f01]="f01-blog-desenvolvimento-web"
)

SAMPLE=(a01 a07 b01 b04 c01 c06 d01 d03 e01 f01)
CAT_D=(d01 d03)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Lighthouse Integration Audit — $(date '+%Y-%m-%d %H:%M')"
echo " Amostra: ${#SAMPLE[@]} sites"
[ -n "$DOMAIN" ] && echo " Modo: PRODUÇÃO ($DOMAIN)" || echo " Modo: LOCAL (dist/ serve)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

declare -A RESULTS_PERF
declare -A RESULTS_SEO
declare -A RESULTS_A11Y
declare -A RESULTS_LCP
declare -A RESULTS_CLS
declare -A RESULTS_INP
declare -A RESULTS_STATUS

get_score() {
  local json="$1" key="$2"
  node -e "
    try {
      const r = require('$json');
      const v = $key;
      console.log(Math.round(v * 100 > 1 ? v : v * 100));
    } catch(e) { console.log('N/A'); }
  " 2>/dev/null || echo "N/A"
}

for short in "${SAMPLE[@]}"; do
  dist_slug="${SLUG_MAP[$short]}"
  JSON="$LH_DIR/lighthouse-${short}.json"

  if [ -n "$DOMAIN" ]; then
    URL="https://${short}.${DOMAIN}"
  else
    # Modo local: serve dist dir
    SITE_DIR="$DIST_DIR/$dist_slug"
    if [ ! -d "$SITE_DIR" ]; then
      echo "  ⚠ $short: dist/$dist_slug/ não encontrado — PENDING"
      RESULTS_STATUS[$short]="PENDING"
      continue
    fi

    # Matar serve anterior se existir
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

    # Iniciar serve
    npx serve "$SITE_DIR" -p $PORT -s --no-clipboard > /tmp/serve-$short.log 2>&1 &
    SERVE_PID=$!
    # Aguardar serve subir
    for i in 1 2 3 4 5; do
      curl -s "http://localhost:$PORT" > /dev/null 2>&1 && break
      sleep 1
    done
    URL="http://localhost:$PORT"
  fi

  echo -n "  Auditando $short ($URL)... "

  # Rodar Lighthouse
  RETRY=0
  SUCCESS=false
  while [ $RETRY -lt 2 ]; do
    if npx lighthouse "$URL" \
      --output=json \
      --output-path="$LH_DIR/lighthouse-${short}.json" \
      --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
      --quiet \
      --timeout=60 \
      > /tmp/lh-${short}.log 2>&1; then
      SUCCESS=true
      break
    fi
    ((RETRY++)) || true
  done

  # Matar serve local
  [ -n "${SERVE_PID:-}" ] && kill "$SERVE_PID" 2>/dev/null || true

  if [ "$SUCCESS" = false ]; then
    echo "⚠ timeout/erro após $RETRY tentativas"
    RESULTS_STATUS[$short]="ERROR"
    continue
  fi

  # Verificar JSON gerado
  if [ ! -f "$JSON" ] || [ "$(wc -c < "$JSON")" -lt 1000 ]; then
    echo "⚠ JSON inválido — retry"
    RESULTS_STATUS[$short]="ERROR-REPORT"
    continue
  fi

  # Extrair métricas
  PERF=$(node -e "const r=require('$JSON'); console.log(Math.round(r.categories.performance.score*100))" 2>/dev/null || echo "N/A")
  SEO=$(node -e "const r=require('$JSON'); console.log(Math.round(r.categories.seo.score*100))" 2>/dev/null || echo "N/A")
  A11Y=$(node -e "const r=require('$JSON'); console.log(Math.round(r.categories.accessibility.score*100))" 2>/dev/null || echo "N/A")
  LCP=$(node -e "const r=require('$JSON'); const v=r.audits['largest-contentful-paint']?.numericValue||0; console.log((v/1000).toFixed(2)+'s')" 2>/dev/null || echo "N/A")
  CLS=$(node -e "const r=require('$JSON'); const v=r.audits['cumulative-layout-shift']?.numericValue||0; console.log(v.toFixed(3))" 2>/dev/null || echo "N/A")
  INP=$(node -e "const r=require('$JSON'); const v=r.audits['interaction-to-next-paint']?.numericValue||0; console.log(v>0?Math.round(v)+'ms':'-')" 2>/dev/null || echo "-")

  RESULTS_PERF[$short]="$PERF"
  RESULTS_SEO[$short]="$SEO"
  RESULTS_A11Y[$short]="$A11Y"
  RESULTS_LCP[$short]="$LCP"
  RESULTS_CLS[$short]="$CLS"
  RESULTS_INP[$short]="$INP"

  # Determinar status
  IS_CAT_D=false
  for d in "${CAT_D[@]}"; do [ "$short" = "$d" ] && IS_CAT_D=true; done

  PERF_NUM=$(echo "$PERF" | grep -o '^[0-9]*' || echo "0")
  SEO_NUM=$(echo "$SEO" | grep -o '^[0-9]*' || echo "0")

  if [ "$IS_CAT_D" = true ]; then
    PASS=$( [ "${PERF_NUM:-0}" -ge 85 ] && [ "${SEO_NUM:-0}" -ge 90 ] && echo "true" || echo "false" )
  else
    PASS=$( [ "${PERF_NUM:-0}" -ge 95 ] && [ "${SEO_NUM:-0}" -ge 90 ] && echo "true" || echo "false" )
  fi

  [ "$PASS" = "true" ] && RESULTS_STATUS[$short]="PASS" || RESULTS_STATUS[$short]="FAIL"

  STATUS_ICON="✓"
  [ "${RESULTS_STATUS[$short]}" != "PASS" ] && STATUS_ICON="✗"

  echo "$STATUS_ICON Perf=$PERF SEO=$SEO A11y=$A11Y LCP=$LCP CLS=$CLS INP=$INP"
done

# Gerar PERFORMANCE-SCORECARD.md
PASS_COUNT=0
FAIL_COUNT=0
PENDING_COUNT=0

for s in "${SAMPLE[@]}"; do
  st="${RESULTS_STATUS[$s]:-PENDING}"
  case "$st" in PASS) ((PASS_COUNT++)) ;; FAIL) ((FAIL_COUNT++)) ;; *) ((PENDING_COUNT++)) ;; esac
done

VERDICT="APROVADO"
[ $FAIL_COUNT -gt 0 ] && VERDICT="REPROVADO"
[ $PENDING_COUNT -gt 0 ] && VERDICT="REPROVADO (STAGING PENDENTE)"

cat > "$SCORECARD" << MDEOF
# Performance Scorecard — $(date '+%Y-%m-%d %H:%M')

## Por Categoria

| Categoria | Site | Perf | SEO | A11y | LCP | CLS | INP | Status |
|-----------|------|------|-----|------|-----|-----|-----|--------|
| A | a01 | ${RESULTS_PERF[a01]:-N/A} | ${RESULTS_SEO[a01]:-N/A} | ${RESULTS_A11Y[a01]:-N/A} | ${RESULTS_LCP[a01]:-N/A} | ${RESULTS_CLS[a01]:-N/A} | - | ${RESULTS_STATUS[a01]:-PENDING} |
| A | a07 | ${RESULTS_PERF[a07]:-N/A} | ${RESULTS_SEO[a07]:-N/A} | ${RESULTS_A11Y[a07]:-N/A} | ${RESULTS_LCP[a07]:-N/A} | ${RESULTS_CLS[a07]:-N/A} | - | ${RESULTS_STATUS[a07]:-PENDING} |
| B | b01 | ${RESULTS_PERF[b01]:-N/A} | ${RESULTS_SEO[b01]:-N/A} | ${RESULTS_A11Y[b01]:-N/A} | ${RESULTS_LCP[b01]:-N/A} | ${RESULTS_CLS[b01]:-N/A} | - | ${RESULTS_STATUS[b01]:-PENDING} |
| B | b04 | ${RESULTS_PERF[b04]:-N/A} | ${RESULTS_SEO[b04]:-N/A} | ${RESULTS_A11Y[b04]:-N/A} | ${RESULTS_LCP[b04]:-N/A} | ${RESULTS_CLS[b04]:-N/A} | - | ${RESULTS_STATUS[b04]:-PENDING} |
| C | c01 | ${RESULTS_PERF[c01]:-N/A} | ${RESULTS_SEO[c01]:-N/A} | ${RESULTS_A11Y[c01]:-N/A} | ${RESULTS_LCP[c01]:-N/A} | ${RESULTS_CLS[c01]:-N/A} | - | ${RESULTS_STATUS[c01]:-PENDING} |
| C | c06 | ${RESULTS_PERF[c06]:-N/A} | ${RESULTS_SEO[c06]:-N/A} | ${RESULTS_A11Y[c06]:-N/A} | ${RESULTS_LCP[c06]:-N/A} | ${RESULTS_CLS[c06]:-N/A} | - | ${RESULTS_STATUS[c06]:-PENDING} |
| D | d01 | ${RESULTS_PERF[d01]:-N/A} | ${RESULTS_SEO[d01]:-N/A} | ${RESULTS_A11Y[d01]:-N/A} | ${RESULTS_LCP[d01]:-N/A} | ${RESULTS_CLS[d01]:-N/A} | ${RESULTS_INP[d01]:--} | ${RESULTS_STATUS[d01]:-PENDING} |
| D | d03 | ${RESULTS_PERF[d03]:-N/A} | ${RESULTS_SEO[d03]:-N/A} | ${RESULTS_A11Y[d03]:-N/A} | ${RESULTS_LCP[d03]:-N/A} | ${RESULTS_CLS[d03]:-N/A} | ${RESULTS_INP[d03]:--} | ${RESULTS_STATUS[d03]:-PENDING} |
| E | e01 | ${RESULTS_PERF[e01]:-N/A} | ${RESULTS_SEO[e01]:-N/A} | ${RESULTS_A11Y[e01]:-N/A} | ${RESULTS_LCP[e01]:-N/A} | ${RESULTS_CLS[e01]:-N/A} | - | ${RESULTS_STATUS[e01]:-PENDING} |
| F | f01 | ${RESULTS_PERF[f01]:-N/A} | ${RESULTS_SEO[f01]:-N/A} | ${RESULTS_A11Y[f01]:-N/A} | ${RESULTS_LCP[f01]:-N/A} | ${RESULTS_CLS[f01]:-N/A} | - | ${RESULTS_STATUS[f01]:-PENDING} |

## Thresholds

| Métrica | Meta | Cat. D Meta |
|---------|------|------------|
| Performance | ≥ 95 | ≥ 85 |
| SEO | ≥ 90 | ≥ 90 |
| LCP | < 2.5s | < 2.5s |
| CLS | < 0.1 | < 0.1 |
| INP | - | < 200ms |

## Sumário

- ✓ Aprovados: ${PASS_COUNT}
- ✗ Reprovados: ${FAIL_COUNT}
- ⚠ Pendentes (staging): ${PENDING_COUNT}

## Notas

- Modo de execução: $([ -n "$DOMAIN" ] && echo "Produção ($DOMAIN)" || echo "Local (dist/ serve)")
- Sites pendentes requerem deploy em staging para validação completa

## Veredito: ${VERDICT}
MDEOF

echo ""
echo "Scorecard: $SCORECARD"
echo "Veredito: $VERDICT"

[ $FAIL_COUNT -eq 0 ] && [ $PENDING_COUNT -eq 0 ] && touch "$INTEGRATION_DIR/.task2-successful"

[ $FAIL_COUNT -gt 0 ] && exit 1 || exit 0
