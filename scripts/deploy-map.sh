#!/usr/bin/env bash
# =============================================================================
# deploy-map.sh — Mapeamento slug → branch de deploy
#
# Inclua este arquivo nos scripts com:
#   source "$(dirname "${BASH_SOURCE[0]}")/deploy-map.sh"
#
# Depois use:
#   BRANCH="${DEPLOY_MAP[$SLUG]:-}"
#
# Ordem das branches: prioridade por onda (wave 1 primeiro, wave 3 por último)
# Slugs espelham exatamente os nomes de diretório em sites/
# =============================================================================

declare -A DEPLOY_MAP

# --- Wave 1: Ferramentas D (maior potencial de tráfego rápido) ---
DEPLOY_MAP["d01-calculadora-custo-site"]="deploy-01"
DEPLOY_MAP["d02-calculadora-custo-app"]="deploy-02"
DEPLOY_MAP["d03-diagnostico-maturidade-digital"]="deploy-03"
DEPLOY_MAP["d04-calculadora-roi-automacao"]="deploy-04"
DEPLOY_MAP["d05-checklist-presenca-digital"]="deploy-05"

# --- Wave 1: Dor/Problema B (consciência de problema) ---
DEPLOY_MAP["b01-sem-site-profissional"]="deploy-06"
DEPLOY_MAP["b02-site-antigo-lento"]="deploy-07"
DEPLOY_MAP["b03-sem-automacao"]="deploy-08"
DEPLOY_MAP["b04-sem-presenca-digital"]="deploy-09"
DEPLOY_MAP["b05-perder-clientes-online"]="deploy-10"
DEPLOY_MAP["b06-sem-leads-qualificados"]="deploy-19"
DEPLOY_MAP["b07-site-nao-aparece-google"]="deploy-20"
DEPLOY_MAP["b08-concorrente-digital"]="deploy-36"

# --- Wave 1-2: Solução C ---
DEPLOY_MAP["c01-site-institucional-pme"]="deploy-11"
DEPLOY_MAP["c02-landing-page-conversao"]="deploy-12"
DEPLOY_MAP["c03-app-web-negocio"]="deploy-13"
DEPLOY_MAP["c04-ecommerce-pequeno-negocio"]="deploy-14"
DEPLOY_MAP["c05-sistema-agendamento"]="deploy-15"
DEPLOY_MAP["c06-automacao-atendimento"]="deploy-16"
DEPLOY_MAP["c07-sistema-gestao-web"]="deploy-17"
DEPLOY_MAP["c08-manutencao-software"]="deploy-18"

# --- Wave 2: Nicho Vertical A ---
DEPLOY_MAP["a01"]="deploy-27"
DEPLOY_MAP["a02"]="deploy-28"
DEPLOY_MAP["a03"]="deploy-29"
DEPLOY_MAP["a04"]="deploy-30"
DEPLOY_MAP["a05"]="deploy-31"
DEPLOY_MAP["a06"]="deploy-32"
DEPLOY_MAP["a07"]="deploy-23"
DEPLOY_MAP["a08"]="deploy-24"
DEPLOY_MAP["a09"]="deploy-25"
DEPLOY_MAP["a10"]="deploy-26"

# --- Wave 2: Waitlist/Tendência E ---
DEPLOY_MAP["e01-ia-para-pequenos-negocios"]="deploy-33"
DEPLOY_MAP["e02-automacao-whatsapp"]="deploy-34"
DEPLOY_MAP["e03-site-com-ia"]="deploy-35"

# --- Wave 2: Blog Técnico F ---
DEPLOY_MAP["f01-blog-desenvolvimento-web"]="deploy-21"
DEPLOY_MAP["f02-blog-marketing-digital"]="deploy-22"

# Função auxiliar para listar todos os slugs na ordem de deploy
deploy_map_all_slugs() {
  for slug in "${!DEPLOY_MAP[@]}"; do
    echo "$slug ${DEPLOY_MAP[$slug]}"
  done | sort -k2
}
