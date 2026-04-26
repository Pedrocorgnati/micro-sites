#!/bin/bash
# =============================================================================
# setup-uptime-monitors.sh — Cria 36 monitores HTTP no UptimeRobot
#
# Configura um monitor de uptime por site (HTTP GET, intervalo 5 min)
# com alerta de email em caso de downtime de 2+ falhas consecutivas (10 min).
#
# Uso:
#   ./scripts/setup-uptime-monitors.sh
#   DRY_RUN=true ./scripts/setup-uptime-monitors.sh    # simula sem criar
#
# Pré-requisitos:
#   - .env com UPTIMEROBOT_API_KEY e UPTIMEROBOT_ALERT_CONTACT_ID
#   - curl instalado
#   - jq instalado (opcional — fallback para python3 se ausente)
#
# Configuração manual necessária antes de executar:
#   1. Criar conta em https://uptimerobot.com (free tier)
#   2. Gerar API Key em "My Settings" → "API Settings"
#   3. Criar Alert Contact em "My Settings" → "Alert Contacts"
#   4. Copiar IDs e preencher .env
#
# Fonte: module-13-monitoramento/TASK-1/ST001
# Guardrail: INFRA-006
# =============================================================================

set -o pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================================================
# CONFIGURAÇÃO
# =============================================================================

ENV_FILE=".env"
DOMAIN="${DOMAIN:-DOMAIN.com}"
UPTIMEROBOT_API_URL="https://api.uptimerobot.com/v2"
REQUEST_TIMEOUT=10
RATE_LIMIT_SLEEP=0.5
DRY_RUN="${DRY_RUN:-false}"

# Log estruturado
LOG_FILE="docs/uptime-monitor-setup.log"
mkdir -p docs

log() {
  local level="$1"
  local msg="$2"
  local timestamp
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "[$timestamp] [$level] $msg" | tee -a "$LOG_FILE"
}

# =============================================================================
# SLUGS — 36 sites (categorias A-F)
# Ordem: cat A (10) → B (8) → C (8) → D (5) → E (3) → F (2) = 36 total
# =============================================================================

SLUGS=(
  # Categoria A — Nicho Local
  a01 a02 a03 a04 a05 a06 a07 a08 a09 a10
  # Categoria B — Dor de Negócio
  b01 b02 b03 b04 b05 b06 b07 b08
  # Categoria C — Serviço Digital
  c01 c02 c03 c04 c05 c06 c07 c08
  # Categoria D — Ferramenta Interativa
  d01 d02 d03 d04 d05
  # Categoria E — Pré-SaaS / Waitlist
  e01 e02 e03
  # Categoria F — Conteúdo Educativo
  f01 f02
)

EXPECTED_COUNT=36

# =============================================================================
# VALIDAÇÃO DE PRÉ-REQUISITOS
# =============================================================================

validate_prerequisites() {
  local errors=0

  # Verificar contagem de slugs
  if [ "${#SLUGS[@]}" -ne "$EXPECTED_COUNT" ]; then
    log "ERROR" "Contagem de SLUGS incorreta: ${#SLUGS[@]} (esperado: $EXPECTED_COUNT)"
    ((errors++))
  fi

  # Verificar arquivo .env
  if [ ! -f "$ENV_FILE" ]; then
    log "ERROR" "Arquivo $ENV_FILE não encontrado."
    echo -e "${RED}✗ Crie o arquivo .env com:${NC}"
    echo "    UPTIMEROBOT_API_KEY=seu_api_key"
    echo "    UPTIMEROBOT_ALERT_CONTACT_ID=seu_contact_id"
    echo "    DOMAIN=seu-dominio.com.br"
    ((errors++))
  else
    # Carregar variáveis do .env
    # shellcheck disable=SC1090
    set -a
    source "$ENV_FILE"
    set +a
  fi

  # Verificar API Key
  if [ -z "${UPTIMEROBOT_API_KEY:-}" ]; then
    log "ERROR" "UPTIMEROBOT_API_KEY não definida no $ENV_FILE."
    ((errors++))
  fi

  # Verificar Alert Contact ID
  if [ -z "${UPTIMEROBOT_ALERT_CONTACT_ID:-}" ]; then
    log "ERROR" "UPTIMEROBOT_ALERT_CONTACT_ID não definida no $ENV_FILE."
    ((errors++))
  fi

  # Verificar curl
  if ! command -v curl &>/dev/null; then
    log "ERROR" "curl não encontrado. Instale: apt install curl"
    ((errors++))
  fi

  return "$errors"
}

# =============================================================================
# EXTRAIR stat DO JSON DE RESPOSTA
# Usa jq se disponível, python3 como fallback
# =============================================================================

extract_stat() {
  local json="$1"
  if command -v jq &>/dev/null; then
    echo "$json" | jq -r '.stat // "error"' 2>/dev/null
  elif command -v python3 &>/dev/null; then
    echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('stat', 'error'))
except:
    print('parse_error')
"
  else
    # Fallback: regex simples
    echo "$json" | grep -oP '"stat"\s*:\s*"\K[^"]+' | head -1
  fi
}

extract_error_message() {
  local json="$1"
  if command -v jq &>/dev/null; then
    echo "$json" | jq -r '.error // .message // "unknown error"' 2>/dev/null
  else
    echo "$json" | grep -oP '"error"\s*:\s*"\K[^"]+' | head -1 || echo "unknown error"
  fi
}

# =============================================================================
# CRIAR MONITOR NO UPTIMEROBOT
# =============================================================================

create_monitor() {
  local slug="$1"
  local url="https://${slug}.${DOMAIN}"
  local friendly_name="micro-sites-${slug}"

  if [ "$DRY_RUN" = "true" ]; then
    echo -e "  ${YELLOW}[DRY-RUN]${NC} Simulando criação de monitor para $slug ($url)"
    log "DRY_RUN" "Monitor para $slug ($url) não criado (dry run)"
    echo "DRY_RUN"
    return 0
  fi

  local response
  response=$(curl -s \
    --max-time "$REQUEST_TIMEOUT" \
    --connect-timeout 5 \
    -X POST "$UPTIMEROBOT_API_URL/newMonitor" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "api_key=${UPTIMEROBOT_API_KEY}" \
    --data-urlencode "friendly_name=${friendly_name}" \
    --data-urlencode "url=${url}" \
    --data "type=1" \
    --data "interval=300" \
    `# TASK-26 ST002 / CL-275: alert_contacts no formato {id}_{threshold}_{recurrence}` \
    `# threshold=2 (2 falhas consecutivas), recurrence=0 (sem repeat) — vide UPTIME-MONITORING.md.` \
    --data "alert_contacts=${UPTIMEROBOT_ALERT_CONTACT_ID}_2_0" \
    --data "ignore_ssl_errors=0" \
    2>/dev/null || echo '{"stat":"network_error"}')

  local stat
  stat=$(extract_stat "$response")
  echo "$stat:$response"
}

# =============================================================================
# MAIN
# =============================================================================

main() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║     Setup UptimeRobot — Rede de 36 Micro Sites             ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""

  if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}⚠ DRY RUN ativado — nenhum monitor será criado de fato${NC}"
    echo ""
  fi

  log "INFO" "Iniciando setup de ${#SLUGS[@]} monitores UptimeRobot"

  # Validar pré-requisitos
  if ! validate_prerequisites; then
    log "ERROR" "Pré-requisitos falharam. Abortando."
    exit 1
  fi

  echo "API Key: ${UPTIMEROBOT_API_KEY:0:8}…${UPTIMEROBOT_API_KEY: -4}"
  echo "Alert Contact ID: $UPTIMEROBOT_ALERT_CONTACT_ID"
  echo "Domain: $DOMAIN"
  echo "Sites a configurar: ${#SLUGS[@]}"
  echo ""

  # Contadores
  local created=0
  local already_exist=0
  local errors=0
  local current=0
  local total=${#SLUGS[@]}

  # TASK-7 intake-review (CL-333): registro de IDs para rotacao futura.
  local REGISTRY_FILE="scripts/metrics/uptime-monitors.json"
  mkdir -p "$(dirname "$REGISTRY_FILE")"
  echo "{" > "$REGISTRY_FILE"
  echo "  \"generatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$REGISTRY_FILE"
  echo "  \"domain\": \"${DOMAIN}\"," >> "$REGISTRY_FILE"
  echo "  \"monitors\": [" >> "$REGISTRY_FILE"
  local first_registry=1

  for slug in "${SLUGS[@]}"; do
    ((current++))
    printf "[%02d/%02d] %-6s ... " "$current" "$total" "$slug"

    result=$(create_monitor "$slug")
    stat="${result%%:*}"
    response="${result#*:}"

    case "$stat" in
      "ok")
        echo -e "${GREEN}✓${NC} Monitor criado"
        log "SUCCESS" "Monitor criado para $slug"
        ((created++))
        # TASK-7: extrair monitor id e persistir no registro
        local monitor_id=""
        if command -v jq &>/dev/null; then
          monitor_id=$(echo "$response" | jq -r '.monitor.id // ""' 2>/dev/null)
        fi
        [[ $first_registry -eq 1 ]] && first_registry=0 || echo "," >> "$REGISTRY_FILE"
        printf '    { "slug": "%s", "url": "https://%s.%s", "monitorId": "%s" }' \
          "$slug" "$slug" "$DOMAIN" "$monitor_id" >> "$REGISTRY_FILE"
        ;;
      "DRY_RUN")
        ((created++))
        ;;
      "fail")
        local error_msg
        error_msg=$(extract_error_message "$response")
        # Código de erro 2 = monitor já existe
        if echo "$response" | grep -qi "already"; then
          echo -e "${YELLOW}⚠${NC} Monitor já existe"
          log "EXISTS" "Monitor para $slug já existe no UptimeRobot"
          ((already_exist++))
        else
          echo -e "${RED}✗${NC} Erro: $error_msg"
          log "ERROR" "Falha ao criar monitor para $slug: $error_msg | Response: $response"
          ((errors++))
        fi
        ;;
      "network_error")
        echo -e "${RED}✗${NC} Timeout / erro de rede"
        log "ERROR" "Timeout ao criar monitor para $slug"
        ((errors++))
        ;;
      *)
        echo -e "${RED}✗${NC} Resposta inesperada: $stat"
        log "ERROR" "Resposta inesperada para $slug: $stat | Response: $response"
        ((errors++))
        ;;
    esac

    # Rate limiting — evitar throttle da API UptimeRobot
    sleep "$RATE_LIMIT_SLEEP"
  done

  # Fechar JSON registry (TASK-7)
  echo "" >> "$REGISTRY_FILE"
  echo "  ]" >> "$REGISTRY_FILE"
  echo "}" >> "$REGISTRY_FILE"

  # Resumo final
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "RESUMO"
  echo "════════════════════════════════════════════════════════════"
  echo -e "  ${GREEN}✓ Criados:${NC}      $created"
  echo -e "  ${YELLOW}⚠ Já existiam:${NC} $already_exist"
  echo -e "  ${RED}✗ Erros:${NC}        $errors"
  echo ""
  echo "Log completo: $LOG_FILE"
  echo ""

  log "SUMMARY" "Criados=$created | JaExistiam=$already_exist | Erros=$errors | Total=$total"

  if [ "$errors" -gt 0 ]; then
    echo -e "${RED}✗ CONCLUÍDO COM ERROS ($errors falhas).${NC}"
    echo "  Verifique $LOG_FILE para detalhes."
    echo "  Re-execute o script — é idempotente (não duplica monitores existentes)."
    exit 1
  fi

  echo -e "${GREEN}✅ Setup concluído com sucesso.${NC}"
  echo ""
  echo "Próximos passos:"
  echo "  1. Verificar monitores no painel: https://uptimerobot.com/dashboard"
  echo "  2. Confirmar $total monitores listados"
  echo "  3. Testar alerta simulando downtime (via painel → Pause Monitor)"
  echo "  4. Atualizar config/SITES-REGISTRY.md: marcar UptimeRobot como ✓"
  exit 0
}

main "$@"
