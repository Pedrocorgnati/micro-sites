#!/bin/bash
# =============================================================================
# DEPLOY GSC VERIFICATION — Faz upload dos tokens de verificação GSC
#                           para todos os 36 sites na Hostinger via SCP
#
# Pré-requisitos:
#   1. Tokens baixados do GSC em output/gsc-tokens/google{TOKEN}-{slug}.html
#   2. SSH configurado sem senha (chave SSH em ~/.ssh/authorized_keys no Hostinger)
#
# Uso:
#   ./scripts/deploy-gsc-verification.sh
#   HOSTINGER_HOST=host HOSTINGER_USER=user ./scripts/deploy-gsc-verification.sh
#
# Estrutura esperada dos tokens:
#   output/gsc-tokens/google123abc-a01.html
#   output/gsc-tokens/google456def-a02.html
#   ... (um por site)
# =============================================================================

set -o pipefail

HOSTINGER_HOST="${HOSTINGER_HOST:-ftp.seudominio.com}"
HOSTINGER_USER="${HOSTINGER_USER:-cpanel_user}"
HOSTINGER_PATH="${HOSTINGER_PATH:-/home/${HOSTINGER_USER}/public_html}"
DOMAIN="${DOMAIN:-DOMAIN.com}"
TOKEN_DIR="output/gsc-tokens"

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

DEPLOYED=0
FAILED=0
SKIPPED=0

echo "=== DEPLOY DE TOKENS GSC ==="
echo "Host: ${HOSTINGER_HOST}"
echo "User: ${HOSTINGER_USER}"
echo "Path: ${HOSTINGER_PATH}"
echo "Tokens: ${TOKEN_DIR}/"
echo ""

# Verificar se diretório de tokens existe
if [ ! -d "$TOKEN_DIR" ]; then
  echo -e "${RED}✗ ERRO: Diretório $TOKEN_DIR não encontrado.${NC}"
  echo "  Crie o diretório e coloque os tokens GSC nele:"
  echo "  mkdir -p $TOKEN_DIR"
  echo "  cp ~/Downloads/google{TOKEN}.html $TOKEN_DIR/google{TOKEN}-{slug}.html"
  exit 1
fi

# Verificar conectividade SSH
echo "Testando conexão SSH..."
if ! ssh -q -o ConnectTimeout=5 -o BatchMode=yes "${HOSTINGER_USER}@${HOSTINGER_HOST}" exit 2>/dev/null; then
  echo -e "${YELLOW}⚠ SSH não disponível — use FTP ou painel Hostinger para fazer upload manual.${NC}"
  echo ""
  echo "Tokens para upload manual:"
  for slug in "${ALL_SLUGS[@]}"; do
    TOKEN_FILE=$(ls "$TOKEN_DIR"/google*-${slug}.html 2>/dev/null | head -1)
    if [ -n "$TOKEN_FILE" ]; then
      echo "  $slug: $(basename "$TOKEN_FILE") → ${slug}.${DOMAIN}/"
    fi
  done
  exit 0
fi

echo -e "${GREEN}✓ SSH disponível${NC}"
echo ""

for slug in "${ALL_SLUGS[@]}"; do
  # Procurar token para este slug
  TOKEN_FILE=$(ls "$TOKEN_DIR"/google*-${slug}.html 2>/dev/null | head -1)

  if [ -z "$TOKEN_FILE" ]; then
    echo -e "${YELLOW}⚠${NC} ${slug}: token não encontrado em $TOKEN_DIR — SKIP"
    ((SKIPPED++))
    continue
  fi

  TOKEN_FILENAME=$(basename "$TOKEN_FILE")
  DEST_DIR="${HOSTINGER_PATH}/${slug}.${DOMAIN}"
  DEST_PATH="${DEST_DIR}/${TOKEN_FILENAME}"

  # Criar diretório remoto se não existir
  ssh -q "${HOSTINGER_USER}@${HOSTINGER_HOST}" "mkdir -p '$DEST_DIR'" 2>/dev/null

  # Upload via SCP
  if scp -q "$TOKEN_FILE" "${HOSTINGER_USER}@${HOSTINGER_HOST}:${DEST_PATH}" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} ${slug}: ${TOKEN_FILENAME} deployado → ${DEST_PATH}"
    ((DEPLOYED++))
  else
    echo -e "${RED}✗${NC} ${slug}: erro no upload de ${TOKEN_FILENAME}"
    ((FAILED++))
  fi
done

echo ""
echo "=== RESUMO ==="
echo -e "${GREEN}Deployados: $DEPLOYED${NC}"
[ "$SKIPPED" -gt 0 ] && echo -e "${YELLOW}Sem token: $SKIPPED${NC}"
[ "$FAILED" -gt 0 ] && echo -e "${RED}Falhas: $FAILED${NC}"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}✗ $FAILED uploads falharam. Verifique credenciais SSH e caminhos.${NC}"
  exit 1
fi

if [ "$SKIPPED" -gt 0 ]; then
  echo -e "${YELLOW}⚠ $SKIPPED sites sem token. Baixe os tokens faltantes do GSC.${NC}"
  echo "  Ver: output/gsc-tokens/ para os tokens existentes"
  exit 0
fi

echo -e "${GREEN}✓ Todos os tokens deployados com sucesso.${NC}"
echo "Próximo passo: Clicar 'Verificar' em cada propriedade no GSC."
exit 0
