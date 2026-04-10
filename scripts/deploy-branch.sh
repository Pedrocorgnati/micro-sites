#!/usr/bin/env bash
# =============================================================================
# deploy-branch.sh — Deploy de um micro-site para branch Git dedicada
#
# Fluxo:
#   1. Verifica que dist/{slug}/ existe (build precisa ter rodado)
#   2. Cria/recicla git worktree isolado em /tmp/deploy-worktree-{slug}
#      (nunca toca no working tree principal — sem `git checkout` no repo raiz)
#   3. Adquire lock file para evitar deploys paralelos na mesma branch
#   4. rsync --delete dist/{slug}/ → worktree/  (estado limpo e idempotente)
#   5. git add + commit "deploy: {slug} @ {short_hash}"
#   6. git push origin {branch} --force-with-lease
#   7. Remove worktree e libera lock
#
# Uso:
#   bash scripts/deploy-branch.sh <slug> <branch>
#   bash scripts/deploy-branch.sh c01-site-institucional-pme deploy-01
#
# Flags:
#   --dry-run    Simula sem fazer push (útil para validação)
#   -h, --help   Exibe esta mensagem
#
# Rollback:
#   git push origin --delete <branch> && git branch -D <branch>
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
    --help|-h)
      echo ""
      echo "Uso: bash scripts/deploy-branch.sh <slug> <branch> [flags]"
      echo ""
      echo "Deploya um micro-site para uma branch Git dedicada (Hostinger)."
      echo "Usa git worktree isolado em /tmp — não altera o working tree principal."
      echo ""
      echo "Argumentos:"
      echo "  slug    Slug do site (ex: c01-site-institucional-pme)"
      echo "  branch  Branch de deploy (ex: deploy-01, deploy-11)"
      echo ""
      echo "Flags:"
      echo "  --dry-run      Simula o deploy sem fazer push"
      echo "  -h, --help     Exibe esta mensagem"
      echo ""
      echo "Exemplos:"
      echo "  bash scripts/deploy-branch.sh d01-calculadora-custo-site deploy-01"
      echo "  bash scripts/deploy-branch.sh c01-site-institucional-pme deploy-11 --dry-run"
      echo ""
      echo "Rollback: git push origin --delete <branch> && git branch -D <branch>"
      echo ""
      exit 0 ;;
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
WORK_TREE="/tmp/deploy-worktree-${SLUG}"
LOCK_FILE="/tmp/micro-sites-${BRANCH}.lock"

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

# Trap: remove lock + worktree (nunca faz git checkout no working tree principal)
cleanup() {
  rm -f "$LOCK_FILE"
  if [[ -d "$WORK_TREE" ]]; then
    git worktree remove --force "$WORK_TREE" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Deploy via git worktree isolado
# ---------------------------------------------------------------------------

SHORT_HASH=$(git rev-parse --short HEAD)

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  DEPLOY: $SLUG → $BRANCH${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}  [DRY RUN — sem push]${NC}"
fi
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Passo 1: Limpa worktree anterior se existir
log_step "Preparando worktree isolado em $WORK_TREE..."

if [[ -d "$WORK_TREE" ]]; then
  git worktree remove --force "$WORK_TREE" 2>/dev/null || true
  rm -rf "$WORK_TREE"
fi

# Passo 2: Cria worktree — branch existente ou orphan nova
BRANCH_EXISTS_LOCAL=$(git branch --list "$BRANCH")
BRANCH_EXISTS_REMOTE=$(git ls-remote --heads origin "$BRANCH" 2>/dev/null | wc -l | tr -d ' ')

if [[ -n "$BRANCH_EXISTS_LOCAL" ]]; then
  log_info "Branch $BRANCH existe localmente."
  git worktree add "$WORK_TREE" "$BRANCH"
elif [[ "$BRANCH_EXISTS_REMOTE" -gt 0 ]]; then
  log_info "Branch $BRANCH existe no remote. Criando worktree..."
  git fetch origin "$BRANCH" --quiet
  git worktree add "$WORK_TREE" "$BRANCH"
else
  log_info "Branch $BRANCH não existe. Criando como orphan (sem histórico)..."
  # Orphan: cria branch vazia via low-level (compatível com git < 2.38)
  # git worktree add --orphan não existe antes de git 2.38
  EMPTY_TREE=$(git hash-object -t tree /dev/null)
  EMPTY_COMMIT=$(git commit-tree "$EMPTY_TREE" -m "init: $BRANCH (orphan)")
  git branch "$BRANCH" "$EMPTY_COMMIT"
  git worktree add "$WORK_TREE" "$BRANCH"
fi

log_ok "Worktree pronto: $WORK_TREE"

# Passo 3: Sincroniza dist/{slug}/ → worktree
log_step "Sincronizando dist/$SLUG/ → worktree..."

if command -v rsync &>/dev/null; then
  rsync -a --delete --exclude='.git' "$DIST_DIR/" "$WORK_TREE/" --quiet
else
  log_warn "rsync não disponível. Usando cp como fallback."
  find "$WORK_TREE" -mindepth 1 -not -path "$WORK_TREE/.git*" -delete 2>/dev/null || true
  cp -r "$DIST_DIR/." "$WORK_TREE/"
fi

log_ok "Conteúdo sincronizado"

# Passo 4: Commit no worktree
log_step "Commitando no worktree..."

cd "$WORK_TREE"
git add -A

if git diff --cached --quiet; then
  log_warn "Nenhuma mudança detectada. Branch já está atualizada."
  cd "$ROOT_DIR"
  echo ""
  log_ok "DEPLOY IGNORADO (sem mudanças): $SLUG → $BRANCH"
  exit 0
fi

COMMIT_MSG="deploy: $SLUG @ $SHORT_HASH"
git commit -m "$COMMIT_MSG" --quiet
log_ok "Commit: $COMMIT_MSG"

# Passo 5: Push (ou dry-run)
if [[ "$DRY_RUN" == "false" ]]; then
  log_step "Fazendo push para origin/$BRANCH..."
  git push origin "$BRANCH" --force-with-lease || git push origin "$BRANCH" --force
  log_ok "Push concluído → origin/$BRANCH"
else
  log_warn "[DRY RUN] Push omitido. Executaria: git push origin $BRANCH --force-with-lease"
fi

# Retorna ao ROOT antes do cleanup
cd "$ROOT_DIR"

# trap EXIT faz o cleanup do worktree e lock

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
