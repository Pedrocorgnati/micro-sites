#!/bin/bash
# =============================================================================
# apply-htaccess-security.sh — bulk render do template .htaccess para 36 sites
#
# TASK-21 ST002 / CL-638, CL-639
# Fix v1.1 (2026-04-25): evita redirect loop quando OLD_HOST == NEW_DOMAIN.
#   O bloco "legacy migration" (OLD_HOST -> NEW_DOMAIN) so e renderizado se
#   o site tiver `legacyDomain` em config.json E for diferente do canonical.
#   Caso contrario, o bloco e REMOVIDO do output (entre marcadores).
#
# Uso:
#   ./scripts/apply-htaccess-security.sh                 # aplica em todos
#   ./scripts/apply-htaccess-security.sh d01-cal*        # aplica em pattern
#   DRY_RUN=1 ./scripts/apply-htaccess-security.sh
#
# Para cada site, le sites/{slug}/config.json:
#   - `siteUrl` ou `domain` -> NEW_DOMAIN canonical (obrigatorio)
#   - `legacyDomain` (opcional) -> OLD_HOST a redirecionar para canonical
# =============================================================================

set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITES_DIR="$ROOT_DIR/sites"
TEMPLATE="$SITES_DIR/_template/.htaccess.template"
DRY_RUN="${DRY_RUN:-0}"
PATTERN="${1:-*}"

if [ ! -f "$TEMPLATE" ]; then
  echo "ERROR: template ausente em $TEMPLATE"
  exit 1
fi

extract_fields() {
  # Output: <new_domain>\t<legacy_domain>
  local cfg="$1"
  if [ ! -f "$cfg" ]; then printf '\t'; return; fi
  python3 -c "
import json, urllib.parse, sys
try:
  c = json.load(open('$cfg'))
  url = c.get('siteUrl') or c.get('domain') or ''
  legacy = c.get('legacyDomain') or ''
  def host(u):
    if not u: return ''
    p = urllib.parse.urlparse(u if '://' in u else 'https://' + u)
    return p.hostname or u.strip('/')
  print(host(url) + '\t' + host(legacy))
except Exception as e:
  print('\t')
" 2>/dev/null
}

# Remove o bloco "Forcar HTTPS no dominio alvo" (legacy redirect) do template
# quando nao ha legacy host distinto, evitando self-redirect loop.
strip_legacy_block() {
  python3 -c '
import sys
content = sys.stdin.read()
target = (
    "\n# Forcar HTTPS no dominio alvo (apos redirect generico acima)\n"
    "RewriteCond %{HTTP_HOST} ^(?:www\\.)?{OLD_HOST}$ [NC]\n"
    "RewriteRule ^(.*)$ https://{NEW_DOMAIN}/$1 [R=301,L,QSA]\n"
)
if target in content:
    content = content.replace(target, "\n")
sys.stdout.write(content)
'
}

count_ok=0
count_skip=0
count_fail=0

for site_dir in "$SITES_DIR"/$PATTERN; do
  slug=$(basename "$site_dir")
  [ "$slug" = "_template" ] && continue
  [ -d "$site_dir" ] || continue

  fields=$(extract_fields "$site_dir/config.json")
  domain="${fields%%$'\t'*}"
  legacy="${fields##*$'\t'}"

  if [ -z "$domain" ]; then
    echo "SKIP $slug: sem domain/siteUrl em config.json"
    count_skip=$((count_skip + 1))
    continue
  fi

  out="$site_dir/.htaccess"
  template_content=$(cat "$TEMPLATE")

  # Decisao: render legacy block apenas se legacy existir E for distinto.
  if [ -z "$legacy" ] || [ "$legacy" = "$domain" ]; then
    # Sem legacy: remove o bloco para evitar self-redirect loop.
    template_content=$(printf '%s' "$template_content" | strip_legacy_block)
    legacy_used="(none — bloco removido)"
  else
    legacy_used="$legacy"
  fi

  rendered=$(printf '%s' "$template_content" | sed \
    -e "s|{NEW_DOMAIN}|${domain}|g" \
    -e "s|{OLD_HOST}|${legacy:-$domain}|g")

  if [ "$DRY_RUN" = "1" ]; then
    echo "DRY  $slug: would write $out (${#rendered} bytes) — canonical=$domain legacy=$legacy_used"
  else
    echo "$rendered" > "$out"
    echo "OK   $slug: $out — canonical=$domain legacy=$legacy_used"
  fi
  count_ok=$((count_ok + 1))
done

echo ""
echo "Sumario: ok=$count_ok skip=$count_skip fail=$count_fail"
