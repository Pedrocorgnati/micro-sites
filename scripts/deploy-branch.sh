#!/usr/bin/env bash
# =============================================================================
# deploy-branch.sh — Deploy de um micro-site para branch Git dedicada
#
# Fluxo:
#   1. Verifica que dist/{slug}/ existe (build precisa ter rodado)
#   2. Adquire lock file para evitar deploys paralelos na mesma branch
#   3. Faz checkout (ou cria como orphan) da branch deploy-{NN}
#   4. rsync --delete dist/{slug}/ → ./  (estado limpo e idempotente)
#   5. git add + commit "deploy: {slug} @ {short_hash}"
#   6. git push origin deploy-{NN}
#   7. Retorna para main e libera o lock
#
# Uso:
#   bash scripts/deploy-branch.sh <slug> <branch>
#   bash scripts/deploy-branch.sh c01-site-institucional-pme deploy-01
#
# Flags:
#   --dry-run    Simula sem fazer push (útil para validação)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Flags
# ---------------------------------------------------------------------------

DRY_RUN=false
SLUG=""
BRANCH=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --*)       echo "Flag desconhecida: $arg" >&2; exit 1 ;;
    *)
      if [[ -z "$SLUG" ]];   then SLUG="$arg"
      elif [[ -z "$BRANCH" ]]; then BRANCH="$arg"
      fi
      ;;
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

# ---------------------------------------------------------------------------
# Validação de argumentos
# ---------------------------------------------------------------------------

if [[ -z "$SLUG" ]] || [[ -z "$BRANCH" ]]; then
  log_error "Uso: bash scripts/deploy-branch.sh <slug> <branch> [--dry-run]"
  log_error "Exemplo: bash scripts/deploy-branch.sh c01-site-institucional-pme deploy-01"
  exit 1
fi

# Valida formato da branch
if ! [[ "$BRANCH" =~ ^deploy-[0-9]{2}$ ]]; then
  log_error "Branch inválida: '$BRANCH' (esperado: deploy-NN, ex: deploy-01)"
  exit 1
fi

DIST_DIR="$ROOT_DIR/dist/$SLUG"
LOCK_FILE="/tmp/micro-sites-${BRANCH}.lock"
CURRENT_BRANCH=""

# ---------------------------------------------------------------------------
# Verifica pré-condições
# ---------------------------------------------------------------------------

if [[ ! -d "$DIST_DIR" ]]; then
  log_error "dist/$SLUG/ não encontrado. Execute primeiro:"
  log_error "  bash scripts/build-site.sh $SLUG"
  exit 1
fi

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  log_error "dist/$SLUG/index.html não encontrado. O build pode ter falhado."
  exit 1
fi

# Verifica que estamos num repositório git
cd "$ROOT_DIR"
if ! git rev-parse --git-dir &>/dev/null; then
  log_error "Não é um repositório git: $ROOT_DIR"
  exit 1
fi

# ---------------------------------------------------------------------------
# Lock file — previne deploys paralelos na mesma branch
# ---------------------------------------------------------------------------

if [[ -f "$LOCK_FILE" ]]; then
  LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "?")
  log_error "Branch $BRANCH está ocupada (lock: $LOCK_FILE, PID: $LOCK_PID)"
  log_error "Se o deploy anterior terminou, remova: rm $LOCK_FILE"
  exit 1
fi

echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"; [[ -n "$CURRENT_BRANCH" ]] && git checkout "$CURRENT_BRANCH" 2>/dev/null || true' EXIT

# ---------------------------------------------------------------------------
# Deploy
# ---------------------------------------------------------------------------

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
SHORT_HASH=$(git rev-parse --short HEAD)

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  DEPLOY: $SLUG → $BRANCH${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}  [DRY RUN — sem push]${NC}"
fi
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verifica se a branch de deploy já existe (local ou remota)
log_step "Verificando branch $BRANCH..."

BRANCH_EXISTS_LOCAL=$(git branch --list "$BRANCH")
BRANCH_EXISTS_REMOTE=$(git ls-remote --heads origin "$BRANCH" 2>/dev/null | wc -l | tr -d ' ')

if [[ -n "$BRANCH_EXISTS_LOCAL" ]]; then
  log_info "Branch $BRANCH existe localmente."
  git checkout "$BRANCH"
elif [[ "$BRANCH_EXISTS_REMOTE" -gt 0 ]]; then
  log_info "Branch $BRANCH existe no remote. Fazendo checkout..."
  git checkout -b "$BRANCH" "origin/$BRANCH"
else
  log_info "Branch $BRANCH não existe. Criando como orphan (sem histórico)..."
  git checkout --orphan "$BRANCH"
  git rm -rf . --quiet 2>/dev/null || true
fi

log_ok "Na branch: $BRANCH"

# Rsync do conteúdo do build para a raiz da branch
log_step "Sincronizando dist/$SLUG/ → ./..."

if ! command -v rsync &>/dev/null; then
  log_warn "rsync não disponível. Usando cp como fallback."
  rm -rf ./*  2>/dev/null || true
  cp -r "$DIST_DIR"/. .
else
  rsync -av --delete --exclude='.git/' "$DIST_DIR/" . --quiet
fi

log_ok "Conteúdo sincronizado"

# Commit
log_step "Commitando..."

git add -A

if git diff --cached --quiet; then
  log_warn "Nenhuma mudança detectada. Branch já está atualizada."
  git checkout "$CURRENT_BRANCH"
  rm -f "$LOCK_FILE"
  echo ""
  log_ok "DEPLOY IGNORADO (sem mudanças): $SLUG → $BRANCH"
  exit 0
fi

COMMIT_MSG="deploy: $SLUG @ $SHORT_HASH"
git commit -m "$COMMIT_MSG" --quiet
log_ok "Commit: $COMMIT_MSG"

# Push
if [[ "$DRY_RUN" == "false" ]]; then
  log_step "Fazendo push para origin/$BRANCH..."
  git push origin "$BRANCH" --force-with-lease
  log_ok "Push concluído → origin/$BRANCH"
else
  log_warn "[DRY RUN] Push omitido. Executaria: git push origin $BRANCH"
fi

# Retorna para a branch original
git checkout "$CURRENT_BRANCH" --quiet
log_ok "Retornou para branch: $CURRENT_BRANCH"

# Lock é removido pelo trap EXIT

# ---------------------------------------------------------------------------
# Relatório final
# ---------------------------------------------------------------------------

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log_ok "DEPLOY COMPLETO"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Site:    $SLUG"
echo "  Branch:  $BRANCH"
echo "  Commit:  $COMMIT_MSG"
if [[ "$DRY_RUN" == "true" ]]; then
  echo "  Status:  DRY RUN (sem push)"
fi
echo ""
echo -e "${YELLOW}Nota:${NC} Hostinger fará git pull automático na próxima sincronização."
echo ""
