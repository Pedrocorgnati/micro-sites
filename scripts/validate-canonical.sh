#!/bin/bash
# =============================================================================
# VALIDATE CANONICAL — Validação de canonical URLs em batch (36 micro-sites)
#
# Uso:
#   ./scripts/validate-canonical.sh                  # Modo local (sem HTTP)
#   ./scripts/validate-canonical.sh DOMAIN.com       # HTTP contra domínio real
#   ./scripts/validate-canonical.sh --local          # Força modo local
#
# Saída: stdout + docs/canonical-check-YYYYMMDD.log
# Exit code: 0 se zero erros, 1 se problemas encontrados
# =============================================================================

set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse args
LOCAL_MODE=false
DOMAIN="DOMAIN.com"

for arg in "$@"; do
  if [ "$arg" = "--local" ]; then
    LOCAL_MODE=true
  elif [[ "$arg" != --* ]]; then
    DOMAIN="$arg"
  fi
done

TIMEOUT=10
LOG_FILE="docs/canonical-check-$(date +%Y%m%d-%H%M%S).log"

# Todos os slugs em ordem canônica
ALL_SLUGS=(
  a01 a02 a03 a04 a05 a06 a07 a08 a09 a10
  b01 b02 b03 b04 b05 b06 b07 b08
  c01 c02 c03 c04 c05 c06 c07 c08
  d01 d02 d03 d04 d05
  e01 e02 e03
  f01 f02
)

# Contadores
canonical_ok=0
canonical_missing=0
canonical_format_error=0
canonical_http_error=0
canonical_local_ok=0
declare -a FAILED_SITES=()

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="$1"
  echo "$(date +'%Y-%m-%d %H:%M:%S') — $msg" | tee -a "$LOG_FILE"
}

# Verifica canonical via leitura de config.json local
check_canonical_local() {
  local slug="$1"
  local sites_dir="sites"

  # Encontrar pasta do site pelo prefix do slug
  local site_dir=""
  for d in "$sites_dir"/${slug}*; do
    if [ -d "$d" ]; then
      site_dir="$d"
      break
    fi
  done

  if [ -z "$site_dir" ]; then
    log "  ⚠ $slug: pasta não encontrada (site ainda não criado)"
    return 0  # Não conta como erro — site pode não existir ainda
  fi

  # Verificar que config.json tem slug e seo.title (canonical é gerado automaticamente)
  local config_file="$site_dir/config.json"
  if [ ! -f "$config_file" ]; then
    log "  ✗ $slug: config.json ausente em $site_dir"
    ((canonical_missing++))
    FAILED_SITES+=("$slug: config.json ausente")
    return 1
  fi

  # Validar slug no config
  local config_slug
  config_slug=$(jq -r '.slug // empty' "$config_file" 2>/dev/null)

  if [ -z "$config_slug" ]; then
    log "  ✗ $slug: campo 'slug' ausente no config.json"
    ((canonical_format_error++))
    FAILED_SITES+=("$slug: campo slug ausente")
    return 1
  fi

  # Verificar que seo existe
  local has_seo
  has_seo=$(jq -r '.seo.title // empty' "$config_file" 2>/dev/null)

  if [ -z "$has_seo" ]; then
    log "  ✗ $slug: seo.title ausente — canonical não pode ser gerado corretamente"
    ((canonical_missing++))
    FAILED_SITES+=("$slug: seo.title ausente")
    return 1
  fi

  log "  ✓ $slug: config válido (slug='$config_slug', seo.title presente)"
  ((canonical_ok++))
  return 0
}

# Verifica canonical via HTTP
check_canonical_http() {
  local slug="$1"
  local url="https://${slug}.${DOMAIN}"

  log "Checking $slug (HTTP)..."

  local html
  html=$(curl -s --max-time "$TIMEOUT" -L "$url" 2>/dev/null)

  if [ -z "$html" ]; then
    log "  ✗ $slug: Falha ao conectar em $url"
    ((canonical_http_error++))
    FAILED_SITES+=("$slug: HTTP falhou ($url)")
    return 1
  fi

  local canonical
  canonical=$(echo "$html" | grep -oP 'rel="canonical" href="\K[^"]+' | head -1)

  if [ -z "$canonical" ]; then
    log "  ✗ $slug: Canonical link não encontrado no HTML"
    ((canonical_missing++))
    FAILED_SITES+=("$slug: canonical ausente no HTML")
    return 1
  fi

  # Validar formato: https://{slug}.{DOMAIN}/
  local expected="${url}/"
  if [ "$canonical" != "$expected" ]; then
    log "  ⚠ $slug: Formato incorreto — esperado '$expected', encontrado '$canonical'"
    ((canonical_format_error++))
    FAILED_SITES+=("$slug: canonical format error")
    return 1
  fi

  # Verificar que canonical URL responde HTTP 200
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$canonical" 2>/dev/null)

  if [ "$http_code" != "200" ]; then
    log "  ✗ $slug: Canonical URL retornou HTTP $http_code"
    ((canonical_http_error++))
    FAILED_SITES+=("$slug: canonical HTTP $http_code")
    return 1
  fi

  log "  ✓ $slug: OK (canonical válido, HTTP $http_code)"
  ((canonical_ok++))
  return 0
}

# =============================================================================
# EXECUÇÃO PRINCIPAL
# =============================================================================

if $LOCAL_MODE; then
  log "========== VALIDAÇÃO CANONICAL — MODO LOCAL =========="
  log "Verificando config.json de cada site"
else
  log "========== VALIDAÇÃO CANONICAL — MODO HTTP =========="
  log "Domínio: $DOMAIN | Timeout: ${TIMEOUT}s"
fi

log "Total de sites: ${#ALL_SLUGS[@]}"
log ""

for slug in "${ALL_SLUGS[@]}"; do
  if $LOCAL_MODE; then
    check_canonical_local "$slug"
  else
    check_canonical_http "$slug"
  fi
done

# =============================================================================
# RESUMO
# =============================================================================

TOTAL_ERRORS=$((canonical_missing + canonical_format_error + canonical_http_error))

echo ""
echo -e "${GREEN}========== CANONICAL URL VALIDATION SUMMARY ==========${NC}"
echo "Total de sites verificados: ${#ALL_SLUGS[@]}"
echo -e "${GREEN}✓ OK: $canonical_ok${NC}"

if [ "$canonical_missing" -gt 0 ]; then
  echo -e "${RED}✗ Canonical ausente: $canonical_missing${NC}"
fi
if [ "$canonical_format_error" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Formato incorreto: $canonical_format_error${NC}"
fi
if [ "$canonical_http_error" -gt 0 ]; then
  echo -e "${RED}✗ Erro HTTP: $canonical_http_error${NC}"
fi

if [ "${#FAILED_SITES[@]}" -gt 0 ]; then
  echo ""
  echo "SITES COM PROBLEMA:"
  for site in "${FAILED_SITES[@]}"; do
    echo -e "  ${RED}✗${NC} $site"
  done
fi

echo "========================================================"
echo "Log: $LOG_FILE"

if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo -e "${GREEN}✓ Todas as canonical URLs estão configuradas corretamente${NC}"
  exit 0
else
  echo -e "${RED}✗ $TOTAL_ERRORS problemas encontrados${NC}"
  exit 1
fi
