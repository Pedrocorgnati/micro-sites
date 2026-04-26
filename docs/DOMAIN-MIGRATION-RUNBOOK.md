# Runbook — Migracao de Subdominio Hostinger → Dominio Proprio

**Objetivo:** migrar um micro-site do subdominio `{slug}.DOMAIN.com` para um dominio proprio sem perder SEO ou leads.

**Ferramentas:**
- `scripts/migrate-domain.sh` — orquestrador (pre-checks + baseline + htaccess + validacao + checklist)
- `scripts/generate-htaccess-redirects.ts` — gerador de .htaccess (chamado pelo orquestrador)
- `.htaccess.template` — template base de redirects

**Atalho (resolve CL-254):**
```bash
bash scripts/migrate-domain.sh <slug> <newDomain> [oldHost]
# --live: roda curl apos deploy
# --dry-run: so imprime o plano
```
Gera `docs/migration-baseline-{slug}.json` + `docs/migrations/{slug}-{date}.md` (checklist D+1/D+3/D+7/D+14).

---

## Pre-checks (D-7)

1. **SEO baseline:** exportar relatorio GSC ultimos 90 dias (impressions/clicks/pages) → `docs/migration-baseline-{slug}.json`
2. **Sitemap atual:** validar `https://{slug}.DOMAIN.com/sitemap.xml` indexado (status 200, lastmod recente)
3. **Leads atuais:** exportar submissions do Static Forms do periodo (manter historico pre-migracao)
4. **Backup .htaccess existente** em `dist/{slug}/.htaccess.backup`
5. **Checar conflitos:** `npm run validate:all` passa

---

## Steps (D-0)

### 1. Comprar dominio
- Registrar o dominio alvo (Registro.br, Namecheap, Cloudflare)
- Ativar auto-renew e DNSSEC

### 2. Apontar DNS
```
A     @     {IP_HOSTINGER}
CNAME www   {slug}.DOMAIN.com
```
Aguardar propagacao (`dig +short NEW_DOMAIN @1.1.1.1`).

### 3. Gerar .htaccess de redirect
```bash
tsx scripts/generate-htaccess-redirects.ts {slug} {NEW_DOMAIN} {OLD_HOST}
```
Valida output em `dist/{slug}/.htaccess`. Revisar regex `RewriteCond` e garantir que captura www + apex.

### 4. Deploy
```bash
bash scripts/deploy-branch.sh {slug}
```
Verifica no Hostinger File Manager se `.htaccess` foi copiado.

### 5. Validar 301
```bash
curl -sI https://{slug}.DOMAIN.com/ | head -n 1     # HTTP/1.1 301 Moved Permanently
curl -sI https://{slug}.DOMAIN.com/ | grep -i location  # Location: https://{NEW_DOMAIN}/
curl -sI https://{slug}.DOMAIN.com/blog/post-foo/    # preserva path
```

### 6. Google Search Console
- Adicionar a nova propriedade (URL-prefix)
- Submeter sitemap do novo dominio
- Usar "Change of Address" tool (GSC → Configuracoes → Change of Address) apontando dominio antigo → novo
- Re-submeter sitemap antigo (para GSC reprocessar redirects)

---

## Post-checks (D+1 → D+14)

- [ ] **D+1:** 90%+ das URLs antigas retornam 301 (amostra de 20 URLs diferentes)
- [ ] **D+3:** GSC comeca a mostrar impressoes no novo dominio
- [ ] **D+7:** Trafego total (antigo + novo) >= 80% do baseline
- [ ] **D+14:** Trafego total >= 95% do baseline; leads continuam fluindo no Static Forms

Alertas: se queda > 20% em D+7, investigar redirects (`curl -I` URLs especificas) e corrigir regex.

---

## Rollback

Se queda >= 30% em D+3 ou erros 500 generalizados:

1. Restaurar `.htaccess.backup` → `dist/{slug}/.htaccess`
2. Redeploy (Hostinger File Manager)
3. No GSC, reverter Change of Address
4. Registrar postmortem em `docs/incidents/migration-{slug}-{date}.md`

---

## Anexo: checklist Static Forms

Apos migracao, endpoints continuam validos. Verificar:
- [ ] Campo `_next` nos forms aponta para nova URL `/obrigado` (ou dominio novo)
- [ ] Webhook do Static Forms atualizado com novo dominio de origem (se houver filtro)

Ver `scripts/check-static-forms-quota.ts` para monitorar cota pos-migracao.
