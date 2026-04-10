#!/usr/bin/env bash
# =============================================================================
# build-site.sh — Build completo de um micro-site
#
# Pipeline:
#   1. Valida sites/{slug}/config.json (campos obrigatórios, formatos)
#   2. Executa SITE_SLUG={slug} next build → dist/{slug}/
#   3. Gera OG image via generate-og.ts → dist/{slug}/og-image.png
#   4. Copia .htaccess com headers de segurança para dist/{slug}/
#
# Uso:
#   bash scripts/build-site.sh <slug>
#   bash scripts/build-site.sh c01-site-institucional-pme
#
# Flags:
#   --skip-og     Pula geração de OG image
#   --skip-validate  Pula validação do config.json
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Flags
# ---------------------------------------------------------------------------

SKIP_OG=false
SKIP_VALIDATE=false
SLUG=""

for arg in "$@"; do
  case "$arg" in
    --help|-h)
      echo ""
      echo "Uso: bash scripts/build-site.sh <slug> [flags]"
      echo ""
      echo "Builda um micro-site específico para exportação estática."
      echo ""
      echo "Argumentos:"
      echo "  slug              Slug do site (ex: d01-calculadora-custo-site)"
      echo ""
      echo "Flags:"
      echo "  --skip-og         Pula geração de OG image (mais rápido)"
      echo "  --skip-validate   Pula validação do config.json"
      echo "  -h, --help        Exibe esta mensagem"
      echo ""
      echo "Exemplos:"
      echo "  bash scripts/build-site.sh d01-calculadora-custo-site"
      echo "  bash scripts/build-site.sh c01-site-institucional-pme --skip-og"
      echo "  bash scripts/build-site.sh a01-clinicas-estetica --skip-validate"
      echo ""
      echo "Output: dist/<slug>/"
      echo ""
      exit 0 ;;
    --skip-og)       SKIP_OG=true ;;
    --skip-validate) SKIP_VALIDATE=true ;;
    --*)             echo "Flag desconhecida: $arg" >&2; exit 1 ;;
    *)               SLUG="$arg" ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERRO]${NC}  $1" >&2; }
log_step()  { echo -e "${CYAN}[STEP]${NC}  $1"; }

BUILD_START=$(date +%s)

# ---------------------------------------------------------------------------
# Validação de argumento
# ---------------------------------------------------------------------------

if [[ -z "$SLUG" ]]; then
  log_error "Uso: bash scripts/build-site.sh <slug> [--skip-og] [--skip-validate]"
  log_error "Exemplo: bash scripts/build-site.sh c01-site-institucional-pme"
  exit 1
fi

SITE_DIR="$ROOT_DIR/sites/$SLUG"
CONFIG_FILE="$SITE_DIR/config.json"
DIST_DIR="$ROOT_DIR/dist/$SLUG"

# ---------------------------------------------------------------------------
# Verifica existência do site
# ---------------------------------------------------------------------------

if [[ ! -d "$SITE_DIR" ]]; then
  log_error "Site não encontrado: sites/$SLUG/"
  log_error "Execute primeiro: bash scripts/create-site.sh $SLUG"
  exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  log_error "config.json não encontrado: sites/$SLUG/config.json"
  exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  BUILD: $SLUG${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ---------------------------------------------------------------------------
# FASE 1: Validação do config.json
# ---------------------------------------------------------------------------

if [[ "$SKIP_VALIDATE" == "false" ]]; then
  log_step "Fase 1: Validando config.json..."

  VALIDATION_ERRORS=0
  VALIDATION_WARNINGS=0

  # Verifica se é JSON válido
  if ! node -e "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf-8'))" 2>/dev/null; then
    log_error "config.json é JSON inválido"
    exit 1
  fi

  # Extrai campos via node
  SLUG_FIELD=$(node -e "console.log(require('$CONFIG_FILE').slug ?? '')")
  CATEGORY=$(node -e "console.log(require('$CONFIG_FILE').category ?? '')")
  NAME=$(node -e "console.log(require('$CONFIG_FILE').name ?? '')")
  TEMPLATE=$(node -e "console.log(require('$CONFIG_FILE').template ?? '')")
  SEO_TITLE=$(node -e "console.log(require('$CONFIG_FILE').seo?.title ?? '')")
  SEO_DESC=$(node -e "console.log(require('$CONFIG_FILE').seo?.description ?? '')")
  WA_NUMBER=$(node -e "console.log(require('$CONFIG_FILE').cta?.whatsappNumber ?? '')")
  FORM_ENDPOINT=$(node -e "console.log(require('$CONFIG_FILE').cta?.formEndpoint ?? '')")

  # --- Validações de erro (bloqueantes) ---

  # Slug no config deve bater com o slug do diretório
  if [[ "$SLUG_FIELD" != "$SLUG" ]]; then
    log_error "config.slug ('$SLUG_FIELD') difere do diretório ('$SLUG')"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi

  # Categoria válida
  if ! [[ "$CATEGORY" =~ ^[A-F]$ ]]; then
    log_error "config.category inválida: '$CATEGORY' (esperado: A-F)"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi

  # Nome não pode ser vazio ou placeholder
  if [[ -z "$NAME" ]] || [[ "$NAME" == *"__"* ]]; then
    log_error "config.name está vazio ou contém placeholder: '$NAME'"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi

  # Template válido
  if ! [[ "$TEMPLATE" =~ ^(landing|blog|calculator|waitlist)$ ]]; then
    log_error "config.template inválido: '$TEMPLATE' (esperado: landing|blog|calculator|waitlist)"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi

  # formEndpoint deve ser URL válida
  if ! node -e "new URL('$FORM_ENDPOINT')" 2>/dev/null; then
    log_error "config.cta.formEndpoint não é uma URL válida: '$FORM_ENDPOINT'"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
  fi

  # WhatsApp: apenas dígitos
  if ! [[ "$WA_NUMBER" =~ ^[0-9]+$ ]]; then
    log_warn "config.cta.whatsappNumber contém caracteres não numéricos: '$WA_NUMBER'"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi

  # --- Validações de warning (não bloqueantes) ---

  SEO_TITLE_LEN=${#SEO_TITLE}
  if [[ $SEO_TITLE_LEN -gt 60 ]]; then
    log_warn "seo.title muito longo: $SEO_TITLE_LEN chars (máximo recomendado: 60)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi

  SEO_DESC_LEN=${#SEO_DESC}
  if [[ $SEO_DESC_LEN -gt 155 ]]; then
    log_warn "seo.description muito longo: $SEO_DESC_LEN chars (máximo recomendado: 155)"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi

  # Placeholders no config
  if node -e "const c=require('$CONFIG_FILE'); JSON.stringify(c).includes('__') && process.exit(1)" 2>/dev/null; then
    : # ok
  else
    log_warn "config.json contém placeholders '__...__' não substituídos"
    VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
  fi

  if [[ $VALIDATION_ERRORS -gt 0 ]]; then
    echo ""
    log_error "Validação falhou com $VALIDATION_ERRORS erro(s). Build abortado."
    exit 1
  fi

  log_ok "Validação: $VALIDATION_WARNINGS warning(s), 0 erros"
fi

# ---------------------------------------------------------------------------
# FASE 2: Next.js Static Export
# ---------------------------------------------------------------------------

log_step "Fase 2: Executando next build (SITE_SLUG=$SLUG)..."

cd "$ROOT_DIR"

if ! SITE_SLUG="$SLUG" npm run build; then
  log_error "next build falhou para $SLUG"
  exit 1
fi

log_ok "Build concluído → dist/$SLUG/"

# ---------------------------------------------------------------------------
# FASE 3: OG Image
# ---------------------------------------------------------------------------

if [[ "$SKIP_OG" == "false" ]]; then
  log_step "Fase 3: Gerando OG image (1200×630)..."

  if [[ -f "$ROOT_DIR/scripts/generate-og.ts" ]]; then
    # Verifica se satori está instalado
    if node -e "require('satori')" 2>/dev/null; then
      if SITE_SLUG="$SLUG" npx tsx scripts/generate-og.ts "$SLUG" 2>&1; then
        log_ok "OG image gerada → dist/$SLUG/og-image.png"
      else
        log_warn "Falha na geração de OG image. Build continua sem og-image.png"
      fi
    else
      log_warn "satori não instalado. Pulando OG image."
      log_warn "Para instalar: npm install satori @resvg/resvg-js"
    fi
  else
    log_warn "scripts/generate-og.ts não encontrado. Pulando OG image."
  fi
fi

# ---------------------------------------------------------------------------
# FASE 4: .htaccess com headers de segurança
# ---------------------------------------------------------------------------

log_step "Fase 4: Gerando .htaccess com headers de segurança..."

cat > "$DIST_DIR/.htaccess" << 'HTACCESS'
# Headers de segurança — gerado por build-site.sh

# Prevenir clickjacking
Header set X-Frame-Options "SAMEORIGIN"

# Prevenir MIME type sniffing
Header set X-Content-Type-Options "nosniff"

# Referrer policy
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Permissions policy (desabilitar features desnecessárias)
Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"

# Cache para assets estáticos (JS, CSS, imagens, fontes hasheadas pelo Next.js)
<FilesMatch "\.(js|css|png|jpg|jpeg|svg|woff2|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Cache para HTML (curto para permitir atualizações)
<FilesMatch "\.html$">
    Header set Cache-Control "public, max-age=3600"
</FilesMatch>

# Redirecionar para HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
HTACCESS

log_ok ".htaccess gerado → dist/$SLUG/.htaccess"

# ---------------------------------------------------------------------------
# Relatório final
# ---------------------------------------------------------------------------

BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))

DIST_SIZE=""
if command -v du &>/dev/null; then
  DIST_SIZE=$(du -sh "$DIST_DIR" 2>/dev/null | cut -f1 || echo "N/A")
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log_ok "BUILD COMPLETO: $SLUG"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Slug:        $SLUG"
echo "  Output:      dist/$SLUG/"
echo "  Tamanho:     ${DIST_SIZE:-N/A}"
echo "  Duração:     ${BUILD_DURATION}s"
echo ""
echo -e "${YELLOW}Próximo passo:${NC}"
echo "  bash scripts/deploy-branch.sh $SLUG deploy-NN"
echo ""
