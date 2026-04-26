# Security Headers — Padrao para 36 sites

**Versao:** v1.0 (2026-04-25 — TASK-21 ST003 / CL-638, CL-639)
**Vincula:** `sites/_template/.htaccess.template`, `scripts/audit-security-headers.ts`

> Define os headers de seguranca padronizados em todos os 36 sites e
> documenta o motivo + tradeoff de cada um.

---

## Headers padronizados

### 1. Strict-Transport-Security (HSTS)

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

**Motivo:** instrui browser a sempre usar HTTPS por 1 ano apos primeira visita,
mesmo se usuario digitar `http://`. Mitiga downgrade attacks (SSL strip).

**Tradeoff:** se algum subdomino legitimo nao tem cert valido, fica inacessivel
no browser ate `max-age` expirar. Por isso `includeSubDomains` so apos validar
que TODOS os subdominos da rede tem HTTPS funcionando.

**Acao se quebrar:** remover `includeSubDomains` temporariamente (max-age permanece).

### 2. X-Frame-Options: DENY

```apache
Header always set X-Frame-Options "DENY"
```

**Motivo:** evita clickjacking — paginas nao podem ser embedadas em `<iframe>`
de outros sites.

**Tradeoff:** integracoes legitimas que precisam embed (ex: visualizar a pagina
em CRM tipo Pipedrive) ficam quebradas. Para esses casos: trocar para
`SAMEORIGIN` e justificar.

### 3. X-Content-Type-Options: nosniff

```apache
Header always set X-Content-Type-Options "nosniff"
```

**Motivo:** browsers nao tentam adivinhar MIME type. Evita XSS via upload de
arquivo nomeado `.txt` mas com conteudo HTML.

**Tradeoff:** zero. Adotar sempre.

### 4. Referrer-Policy: strict-origin-when-cross-origin

```apache
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

**Motivo:** browsers enviam apenas o origin (sem path/query) para sites externos
em navegacao cross-origin. Para mesma origin envia URL completa. Equilibrio
entre privacy do usuario e analytics interno.

**Tradeoff:** se um parceiro (ex: Pipedrive) precisar saber path completo de
referer, vai ter so o origin. Aceitavel — UTM cobre isso.

### 5. Permissions-Policy

```apache
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()"
```

**Motivo:** desabilita features sensiveis que nenhum site da rede usa. Em
caso de XSS, atacante nao consegue ativar geo/mic/camera mesmo com JS injetado.

**Tradeoff:** se um nicho futuro precisar (ex: clinica medica com chamada de video),
ajustar essa lista no template.

### 6. X-Permitted-Cross-Domain-Policies: none

```apache
Header always set X-Permitted-Cross-Domain-Policies "none"
```

**Motivo:** legacy header para Adobe Flash/PDF readers. Embora obsoleto, ainda
respeitado por alguns crawlers/scanners — fechar por completo nao tem custo.

---

## Force HTTPS

```apache
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !=https
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L,QSA]
```

A segunda condicao (`X-Forwarded-Proto`) cobre cenarios atras de Cloudflare ou
load balancer onde o Apache ve HTTP mas o cliente original veio HTTPS.

**Validacao:** `audit-security-headers.ts` faz HEAD em `http://...` e espera
301 com `Location: https://...`.

---

## Aplicacao bulk

```bash
# Rodar uma vez ou apos mudar template
bash scripts/apply-htaccess-security.sh

# Dry-run primeiro
DRY_RUN=1 bash scripts/apply-htaccess-security.sh
```

O script substitui `{NEW_DOMAIN}` e `{OLD_HOST}` no template e salva em
`sites/{slug}/.htaccess`. Apos validar, commitar.

## Audit em producao

```bash
# Ad-hoc (apos deploy real com domain valido)
npx tsx scripts/audit-security-headers.ts

# Strict (CI gate)
npx tsx scripts/audit-security-headers.ts --strict
```

Workflow `.github/workflows/security-headers-audit.yml` roda toda segunda 05:00 UTC.

## Acoes humanas pendentes

Vide PENDING-ACTIONS bloco `security-headers-2026-04`:

- [ ] Validar Hostinger Shared suporta `Header always set` (alguns shared providers limitam)
- [ ] Apos primeiro deploy real: rodar `securityheaders.com` em 1 domino e capturar score
- [ ] Configurar HSTS preload list (`hstspreload.org`) apos 6 meses estaveis em producao
- [ ] Rever `Permissions-Policy` se nicho futuro precisar de feature bloqueada

## Referencias externas

- [Mozilla Observatory](https://observatory.mozilla.org/)
- [securityheaders.com](https://securityheaders.com/)
- [HSTS Preload](https://hstspreload.org/)

## Versionamento

- v1.0 (2026-04-25) — TASK-21 ST003: padronizacao de 6 headers + force HTTPS
