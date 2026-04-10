#!/usr/bin/env bash
# =============================================================================
# create-site.sh — Cria novo micro-site a partir do _template
#
# Uso:
#   bash scripts/create-site.sh <slug>
#   bash scripts/create-site.sh d01-calculadora-custo-site
#
# O slug deve seguir o padrão: {categoria}{NN}-{descricao}
#   Categorias válidas: a, b, c, d, e, f
#   Exemplo: a01-clinicas-estetica, d03-diagnostico-presenca-digital
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SITES_DIR="$ROOT_DIR/sites"
TEMPLATE_DIR="$SITES_DIR/_template"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERRO]${NC}  $1" >&2; }

# ---------------------------------------------------------------------------
# Validação de argumento
# ---------------------------------------------------------------------------

if [[ $# -lt 1 ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  echo ""
  echo "Uso: bash scripts/create-site.sh <slug>"
  echo ""
  echo "Cria um novo micro-site em sites/<slug>/ a partir do _template."
  echo ""
  echo "Argumentos:"
  echo "  slug    Formato: {a-f}{NN}-{descricao}"
  echo "          Exemplos válidos: a01-clinicas-estetica, d03-diagnostico-presenca-digital"
  echo ""
  echo "Exemplos:"
  echo "  bash scripts/create-site.sh d06-calculadora-roi"
  echo "  bash scripts/create-site.sh a02-academia-crossfit"
  echo "  bash scripts/create-site.sh c01-site-institucional-pme"
  echo ""
  echo "Categorias:"
  echo "  A = Nicho Vertical  B = Dor/Problema  C = Solução"
  echo "  D = Ferramentas     E = Waitlist       F = Blog"
  echo ""
  [[ $# -lt 1 ]] && exit 1 || exit 0
fi

SLUG="$1"

# Valida formato do slug: letra(a-f) + 2 dígitos + hífen + descricao
if ! [[ "$SLUG" =~ ^[a-f][0-9]{2}-.+ ]]; then
  log_error "Slug inválido: '$SLUG'"
  log_error "Formato esperado: {a-f}{NN}-{descricao} (ex: a01-clinicas-estetica)"
  exit 1
fi

# Extrai categoria do slug (primeiro caractere)
CATEGORY_LOWER="${SLUG:0:1}"
CATEGORY="${CATEGORY_LOWER^^}"  # converte para maiúscula

# ---------------------------------------------------------------------------
# Verifica se o template existe
# ---------------------------------------------------------------------------

if [[ ! -d "$TEMPLATE_DIR" ]]; then
  log_error "Template não encontrado: $TEMPLATE_DIR"
  log_error "Certifique-se de que sites/_template/ existe no repositório."
  exit 1
fi

# ---------------------------------------------------------------------------
# Verifica se o site já existe
# ---------------------------------------------------------------------------

SITE_DIR="$SITES_DIR/$SLUG"

if [[ -d "$SITE_DIR" ]]; then
  log_warn "Site '$SLUG' já existe em sites/$SLUG/. Abortando (use --force para sobrescrever)."
  log_warn "Para recriar: rm -rf sites/$SLUG && bash scripts/create-site.sh $SLUG"
  exit 0
fi

# ---------------------------------------------------------------------------
# Cria o site copiando o template
# ---------------------------------------------------------------------------

log_info "Criando site '$SLUG' (Categoria $CATEGORY)..."

cp -r "$TEMPLATE_DIR" "$SITE_DIR"

# ---------------------------------------------------------------------------
# Substitui placeholders no config.json
# ---------------------------------------------------------------------------

CONFIG_FILE="$SITE_DIR/config.json"

# Nome display gerado a partir do slug (substitui hífens por espaços, capitaliza)
DISPLAY_NAME="$(echo "${SLUG#[a-f][0-9][0-9]-}" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2)); print}')"

# Define accent color padrão por categoria
case "$CATEGORY" in
  A) ACCENT="#2563EB" ;;
  B) ACCENT="#EA580C" ;;
  C) ACCENT="#059669" ;;
  D) ACCENT="#7C3AED" ;;
  E) ACCENT="#0891B2" ;;
  F) ACCENT="#1E40AF" ;;
  *) ACCENT="#2563EB" ;;
esac

# Define funnelStage padrão por categoria
case "$CATEGORY" in
  A) FUNNEL="decision"      ;;
  B) FUNNEL="awareness"     ;;
  C) FUNNEL="consideration" ;;
  D) FUNNEL="consideration" ;;
  E) FUNNEL="awareness"     ;;
  F) FUNNEL="awareness"     ;;
  *) FUNNEL="consideration" ;;
esac

# Define template padrão por categoria
case "$CATEGORY" in
  D) TEMPLATE="calculator" ;;
  E) TEMPLATE="waitlist"   ;;
  F) TEMPLATE="blog"       ;;
  *) TEMPLATE="landing"    ;;
esac

# Aplica substituições
sed -i \
  -e "s/__SLUG__/$SLUG/g" \
  -e "s/__NOME_DO_SITE__/$DISPLAY_NAME/g" \
  -e "s/__CATEGORY__/$CATEGORY/g" \
  -e "s/__HEADLINE__/$DISPLAY_NAME/g" \
  -e "s/\"funnelStage\": \"consideration\"/\"funnelStage\": \"$FUNNEL\"/" \
  -e "s/\"template\": \"landing\"/\"template\": \"$TEMPLATE\"/" \
  "$CONFIG_FILE"

# ---------------------------------------------------------------------------
# Relatório final
# ---------------------------------------------------------------------------

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log_ok "Site criado com sucesso!"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Slug:       $SLUG"
echo "  Categoria:  $CATEGORY"
echo "  Template:   $TEMPLATE"
echo "  Funnel:     $FUNNEL"
echo "  Diretório:  sites/$SLUG/"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Edite sites/$SLUG/config.json com dados reais"
echo "  2. Edite sites/$SLUG/content/*.{md,json} com o conteúdo do site"
echo "  3. Execute: bash scripts/build-site.sh $SLUG"
echo ""
