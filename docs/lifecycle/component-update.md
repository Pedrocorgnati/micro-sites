# Runbook — Atualizar Componente Compartilhado

Cobertura: US-020 (Pedro atualiza componente compartilhado e propaga para 36 sites).

## Quando usar

Sempre que houver mudanca em qualquer arquivo de:

- `src/components/ui/` (Footer, Header, WhatsAppButton, Toast, ErrorBoundary, NotFound, Breadcrumbs, estados)
- `src/components/lgpd/` (CookieConsent, GA4Loader, PrivacyPolicy, etc.)
- `src/components/forms/` (ContactFormBase, HoneypotField, ConsentCheckbox, WaitlistForm)
- `src/lib/` (loaders, helpers, schema-markup, sitemap, og-image)
- `public/.htaccess.template`

## Checklist (executar nesta ordem)

### 1. Validacao local
- [ ] `npm run lint` zero warnings
- [ ] `npx tsc --noEmit` zero erros
- [ ] `npm test` (vitest) verde
- [ ] `npm run test:coverage` mantem ≥ 80% na pasta alterada
- [ ] Se mudou form/E2E-relevante: `npm run e2e` verde (requer dist servido)

### 2. Smoke build em 1 site representativo por categoria
Compilar pelo menos 1 site de cada categoria afetada:

```
SITE_SLUG=a01-... bash scripts/build-site.sh   # Cat. A — institucional
SITE_SLUG=c01-... bash scripts/build-site.sh   # Cat. C — servico
SITE_SLUG=d01-... bash scripts/build-site.sh   # Cat. D — calculadora
SITE_SLUG=e01-... bash scripts/build-site.sh   # Cat. E — lista de espera
SITE_SLUG=f01-... bash scripts/build-site.sh   # Cat. F — educativo
```

- [ ] Cada build conclui com codigo 0
- [ ] `dist/{slug}/` contem `index.html`, `.htaccess`, `sitemap.xml`, `og-default.png`

### 3. Smoke visual
- [ ] Rodar `npx http-server dist/{slug} -p 4173` em pelo menos 2 sites de categorias diferentes
- [ ] Verificar manualmente: Header, Footer, CookieConsent banner, WhatsAppButton, formulario `/contato`
- [ ] DevTools: `<script src*="googletagmanager">` AUSENTE antes do click "Aceitar"

### 4. Build em lote (se as smokes passaram)
- [ ] `bash scripts/build-all.sh` (ou equivalente) — todos os 36 sites
- [ ] Conferir que nenhum build foi pulado por erro

### 5. Bump de versao do skeleton compartilhado (quando aplicavel)
Se a mudanca alterar a interface publica de algum componente:
- [ ] Atualizar entrada no `wbs_root/_SHARED-SKELETON.md`
- [ ] Rodar `/next-modules-skeleton-update` no SystemForge para propagar

### 6. Deploy gradual
- [ ] Deploy primeiro em um site nao-critico (ex: `f02-`) e validar
- [ ] Aguardar 24h ou conferir Lighthouse / GA4 nesse site
- [ ] Se ok, propagar para os demais via `bash scripts/deploy-all.sh`

### 7. Pos-deploy
- [ ] Conferir health (HTTP 200) em uma amostra de 5 sites
- [ ] Validar `view-source:{site}` mostra o componente atualizado
- [ ] Registrar mudanca em `output/docs/micro-sites/CHANGELOG.md`

## Rollback

Se qualquer site da rede apresentar regressao:

1. `git revert {commit_id}` no branch principal
2. Re-executar `bash scripts/build-all.sh`
3. Re-executar `bash scripts/deploy-all.sh`
4. Investigar causa em ambiente local antes de re-aplicar
