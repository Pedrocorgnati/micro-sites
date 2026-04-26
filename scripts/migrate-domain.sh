#!/usr/bin/env bash
# =============================================================================
# migrate-domain.sh — Orquestrador de migracao subdominio -> dominio proprio
#
# Automatiza as partes codificaveis do DOMAIN-MIGRATION-RUNBOOK.md:
#   1. Pre-checks: valida slug + dist/ existem; backup do .htaccess atual
#   2. Captura baseline (old host, new domain, date) em docs/migration-baseline-{slug}.json
#   3. Chama generate-htaccess-redirects.ts para gerar dist/{slug}/.htaccess 301
#   4. Valida redirect via curl (se --live) ou gera comandos para rodar manualmente
#   5. Emite checklist D+1/D+3/D+7/D+14 em docs/migrations/{slug}-{date}.md
#
# Acoes humanas NAO automatizadas (requerem intervencao manual):
#   - Comprar dominio (registrador)
#   - Apontar DNS (painel do registrador)
#   - GSC Change of Address (painel Google)
#   - Deploy apos gerar .htaccess (rodar deploy-branch.sh em seguida)
#
# Uso:
#   bash scripts/migrate-domain.sh <slug> <newDomain> [oldHost]
#   bash scripts/migrate-domain.sh d01-calculadora-custo-site calculadora.com d01.meudominio.com
#
# Flags:
#   --live       Roda curl contra o velho host (requer deploy ja feito)
#   --dry-run    Nao escreve arquivos, so imprime plano
#   -h, --help   Exibe esta mensagem
#
# Fonte: DOMAIN-MIGRATION-RUNBOOK.md + gap CL-254 (/skill:resolve-gaps 2026-04-21)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  sed -n '2,30p' "$0" | sed 's/^# \?//'
  exit 0
}

SLUG=""
NEW_DOMAIN=""
OLD_HOST=""
LIVE=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage ;;
    --live) LIVE=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    *)
      if [[ -z "$SLUG" ]]; then SLUG="$1"
      elif [[ -z "$NEW_DOMAIN" ]]; then NEW_DOMAIN="$1"
      elif [[ -z "$OLD_HOST" ]]; then OLD_HOST="$1"
      else echo -e "${RED}Argumento inesperado: $1${NC}"; exit 2
      fi
      shift ;;
  esac
done

if [[ -z "$SLUG" || -z "$NEW_DOMAIN" ]]; then
  echo -e "${RED}Uso: bash scripts/migrate-domain.sh <slug> <newDomain> [oldHost]${NC}"
  exit 2
fi

SITE_DIR="${ROOT_DIR}/sites/${SLUG}"
DIST_DIR="${ROOT_DIR}/dist/${SLUG}"
DOCS_MIG_DIR="${ROOT_DIR}/docs/migrations"
BASELINE_PATH="${ROOT_DIR}/docs/migration-baseline-${SLUG}.json"
DATE_ISO="$(date -u +%Y-%m-%d)"
CHECKLIST_PATH="${DOCS_MIG_DIR}/${SLUG}-${DATE_ISO}.md"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Migrate Domain — ${SLUG}"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Novo dominio:   ${NEW_DOMAIN}"
echo "Slug:           ${SLUG}"
echo "Root:           ${ROOT_DIR}"
echo "Dry run:        $([[ $DRY_RUN == 1 ]] && echo 'SIM' || echo 'nao')"
echo "Live curl:      $([[ $LIVE == 1 ]] && echo 'SIM' || echo 'nao')"
echo ""

# ── 1. Pre-checks ───────────────────────────────────────────────────────────
echo -e "${BLUE}[1/5] Pre-checks${NC}"

if [[ ! -d "$SITE_DIR" ]]; then
  echo -e "${RED}  ✗ sites/${SLUG}/ nao existe${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ sites/${SLUG}/ presente${NC}"

if [[ ! -d "$DIST_DIR" ]]; then
  echo -e "${YELLOW}  ! dist/${SLUG}/ ausente — rodar build-site.sh ${SLUG} antes${NC}"
else
  echo -e "${GREEN}  ✓ dist/${SLUG}/ presente${NC}"
  if [[ -f "${DIST_DIR}/.htaccess" && $DRY_RUN == 0 ]]; then
    cp "${DIST_DIR}/.htaccess" "${DIST_DIR}/.htaccess.backup"
    echo -e "${GREEN}  ✓ backup .htaccess -> .htaccess.backup${NC}"
  fi
fi

# Resolver OLD_HOST a partir do config.json se nao fornecido
if [[ -z "$OLD_HOST" ]]; then
  CFG="${SITE_DIR}/config.json"
  if [[ -f "$CFG" ]]; then
    OLD_HOST=$(node -e "const c=require('${CFG}'); console.log(c.siteUrl || c.domain || '');" 2>/dev/null | sed -E 's#https?://##; s#/.*##')
  fi
fi
if [[ -z "$OLD_HOST" ]]; then
  OLD_HOST="${SLUG}.DOMAIN.com"
  echo -e "${YELLOW}  ! oldHost inferido (fallback): ${OLD_HOST}${NC}"
else
  echo -e "${GREEN}  ✓ oldHost: ${OLD_HOST}${NC}"
fi

# ── 2. Baseline ─────────────────────────────────────────────────────────────
echo -e "${BLUE}[2/5] Baseline${NC}"

BASELINE_JSON=$(cat <<EOF
{
  "slug": "${SLUG}",
  "oldHost": "${OLD_HOST}",
  "newDomain": "${NEW_DOMAIN}",
  "startedAt": "${DATE_ISO}T$(date -u +%H:%M:%SZ)",
  "source": "scripts/migrate-domain.sh",
  "runbook": "docs/DOMAIN-MIGRATION-RUNBOOK.md"
}
EOF
)

if [[ $DRY_RUN == 1 ]]; then
  echo -e "${YELLOW}  [dry-run] gravaria ${BASELINE_PATH}${NC}"
  echo "$BASELINE_JSON" | sed 's/^/    /'
else
  echo "$BASELINE_JSON" > "$BASELINE_PATH"
  echo -e "${GREEN}  ✓ baseline -> ${BASELINE_PATH}${NC}"
fi

# ── 3. Gerar .htaccess de redirect ─────────────────────────────────────────
echo -e "${BLUE}[3/5] .htaccess de redirect${NC}"

if [[ $DRY_RUN == 1 ]]; then
  echo -e "${YELLOW}  [dry-run] executaria: tsx scripts/generate-htaccess-redirects.ts ${SLUG} ${NEW_DOMAIN} ${OLD_HOST}${NC}"
else
  (cd "$ROOT_DIR" && npx tsx scripts/generate-htaccess-redirects.ts "$SLUG" "$NEW_DOMAIN" "$OLD_HOST")
  echo -e "${GREEN}  ✓ dist/${SLUG}/.htaccess gerado${NC}"
fi

# ── 4. Validacao 301 ────────────────────────────────────────────────────────
echo -e "${BLUE}[4/5] Validacao 301${NC}"

validate_urls=(
  "https://${OLD_HOST}/"
  "https://${OLD_HOST}/contato"
  "https://${OLD_HOST}/obrigado"
)

if [[ $LIVE == 1 && $DRY_RUN == 0 ]]; then
  pass=0
  fail=0
  for url in "${validate_urls[@]}"; do
    status=$(curl -sI -o /dev/null -w '%{http_code}' --max-time 10 "$url" || echo "000")
    loc=$(curl -sI --max-time 10 "$url" 2>/dev/null | grep -i '^location:' | tr -d '\r' | cut -d' ' -f2- || true)
    if [[ "$status" == "301" && "$loc" == *"${NEW_DOMAIN}"* ]]; then
      echo -e "${GREEN}  ✓ ${url} -> 301 -> ${loc}${NC}"
      pass=$((pass+1))
    else
      echo -e "${RED}  ✗ ${url} -> ${status} (loc=${loc:-none})${NC}"
      fail=$((fail+1))
    fi
  done
  echo "  Resumo: ${pass} OK / ${fail} falhas"
  if [[ $fail -gt 0 ]]; then
    echo -e "${YELLOW}  ! Validacao falhou em ${fail} URLs. Ver runbook passo 5 e passo Rollback.${NC}"
  fi
else
  echo -e "${YELLOW}  [skip live] rode manualmente apos deploy:${NC}"
  for url in "${validate_urls[@]}"; do
    echo "    curl -sI ${url} | head -n 1"
    echo "    curl -sI ${url} | grep -i location"
  done
fi

# ── 5. Checklist D+1 .. D+14 ────────────────────────────────────────────────
echo -e "${BLUE}[5/5] Checklist pos-migracao${NC}"

CHECKLIST_CONTENT=$(cat <<EOF
# Migration Checklist — ${SLUG} -> ${NEW_DOMAIN}

**Iniciada em:** ${DATE_ISO}
**Old host:** ${OLD_HOST}
**Novo dominio:** ${NEW_DOMAIN}
**Baseline:** docs/migration-baseline-${SLUG}.json
**Runbook:** docs/DOMAIN-MIGRATION-RUNBOOK.md

---

## D-0 — Deploy + validacao inicial

- [ ] \`.htaccess\` gerado em \`dist/${SLUG}/.htaccess\`
- [ ] \`bash scripts/deploy-branch.sh ${SLUG} deploy-XX\`
- [ ] \`curl -sI https://${OLD_HOST}/\` retorna 301
- [ ] \`curl -sI https://${OLD_HOST}/\` Location contem \`${NEW_DOMAIN}\`
- [ ] GSC: adicionar nova propriedade (${NEW_DOMAIN})
- [ ] GSC: submeter sitemap do novo dominio
- [ ] GSC: Change of Address apontando ${OLD_HOST} -> ${NEW_DOMAIN}

## D+1

- [ ] 90%+ das URLs antigas retornam 301 (amostra de 20)
- [ ] Static Forms continua recebendo submissions

## D+3

- [ ] GSC mostra impressoes no novo dominio
- [ ] Nenhum erro 500 no Hostinger error log

## D+7

- [ ] Trafego total (antigo + novo) >= 80% do baseline
- [ ] Rerodar \`bash scripts/migrate-domain.sh ${SLUG} ${NEW_DOMAIN} ${OLD_HOST} --live\` para revalidar redirects

## D+14

- [ ] Trafego total >= 95% do baseline
- [ ] Leads continuam fluindo
- [ ] Atualizar \`siteUrl\` em \`sites/${SLUG}/config.json\` para \`https://${NEW_DOMAIN}\`
- [ ] Atualizar \`sites/${SLUG}/config.json.cta.formEndpoint\` se contiver dominio antigo hardcoded
- [ ] Atualizar \`.htaccess.template\` do site se CSP bloqueia novo dominio

## Rollback (se queda >= 30% em D+3 ou 5xx generalizado)

1. \`cp dist/${SLUG}/.htaccess.backup dist/${SLUG}/.htaccess\`
2. \`bash scripts/deploy-branch.sh ${SLUG} deploy-XX\`
3. GSC: reverter Change of Address
4. Postmortem em \`docs/incidents/migration-${SLUG}-${DATE_ISO}.md\`

EOF
)

if [[ $DRY_RUN == 1 ]]; then
  echo -e "${YELLOW}  [dry-run] gravaria ${CHECKLIST_PATH}${NC}"
else
  mkdir -p "$DOCS_MIG_DIR"
  echo "$CHECKLIST_CONTENT" > "$CHECKLIST_PATH"
  echo -e "${GREEN}  ✓ checklist -> ${CHECKLIST_PATH}${NC}"
fi

echo ""
echo -e "${GREEN}Migracao orquestrada com sucesso.${NC}"
echo ""
echo "Proximos passos manuais:"
echo "  1. bash scripts/deploy-branch.sh ${SLUG} deploy-XX"
echo "  2. Configurar DNS no registrador (A @ IP_HOSTINGER + CNAME www)"
echo "  3. GSC: Change of Address ${OLD_HOST} -> ${NEW_DOMAIN}"
echo "  4. Acompanhar checklist: ${CHECKLIST_PATH}"
echo ""
