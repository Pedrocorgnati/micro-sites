# PENDING-ACTIONS — Micro Sites

Acoes humanas pendentes que a IA nao pode executar diretamente. Cada item tem `idempotency` para evitar duplicacao em comandos repetidos.

---

## Sentry (idempotency: `sentry-setup-2026-04`)

- [ ] Criar projeto Sentry `micro-sites-cat-d` na org SystemForge (Pedro)
- [ ] Criar projeto Sentry `micro-sites-shared` (opcional, scripts/CLI)
- [ ] Copiar DSN para `.env.production` por site Cat D (chave `NEXT_PUBLIC_SENTRY_DSN`)
- [ ] Gerar `SENTRY_AUTH_TOKEN` com scopes `org:read project:releases project:write` e registrar em:
  - `.claude/projects/micro-sites.json > credentials.sentry.auth_token`
  - GitHub secret `SENTRY_AUTH_TOKEN`
- [ ] Configurar Alert Rule no Sentry: novas issues em `micro-sites-cat-d` com tag `component:Calculator` → email `footstockbr@gmail.com`
- [ ] Setar GitHub vars: `SENTRY_ENABLED=1`, `SENTRY_ORG=systemforge`, `SENTRY_PROJECT=micro-sites-cat-d`, `SENTRY_QUOTA=5000`
- [ ] Validar primeiro evento de teste forcando erro em D01 dev e conferindo dashboard

## LGPD (idempotency: `lgpd-2026-04`)

- [ ] Publicar versao da PrivacyPolicy com data `2026-04-24` (commit visivel + atualizar `PRIVACY_POLICY_VERSION`)
- [ ] Configurar Static Forms API token (se ausente) em `credentials.static_forms.api_token`
- [ ] Auditar contas com 2FA habilitado: GitHub, Sentry, GA4, GSC, Hostinger, StaticForms, Vercel, Resend
- [ ] Anexar ROPA assinado em `docs/compliance/ROPA-SIGNED-{YYYY-Q}.pdf` ao final de cada trimestre

## Static Forms quota (idempotency: `sf-quota-runbook-2026-04`)

- [ ] Configurar billing email no SF dashboard
- [ ] Avaliar trade-off SF Pro vs Web3Forms (pos atingir >70% quota)
- [ ] Criar conta Web3Forms backup (CL-534-535)

## Sentry-CLI (idempotency: `sentry-cli-install-2026-04`)

- [ ] Garantir `@sentry/cli` disponivel no runner CI (instalado via `npx`, sem acao manual)

## Sourcemaps (idempotency: `sourcemaps-2026-04`)

- [ ] Confirmar com Pedro que sourcemaps em `dist/` Cat D nao sao publicados publicamente (validar em pos-deploy primeiro release)

## GEO Monitoring (idempotency: `geo-monitoring-2026-04`)

- [ ] Definir 5-15 keywords-foco por site Cat A/B/C/D em `config/geo-monitoring-keywords.json`
- [ ] Criar conta SerpAPI (opcional, fallback de Tavily AI Overview parsing) — somente se Tavily nao expor o overview snippet
- [ ] Configurar `OPENAI_API_KEY` (RUNTIME?) — decisao: ORCH (script-only) → registrar em `credentials.ai.openai.api_key`

## Sunset & Dormancy (idempotency: `sunset-dormancy-2026-04`)

- [ ] Configurar GSC Service Account (`credentials.gsc.service_account`) — necessario para `gsc-indexing-watch.ts` e `site-dormancy-watch.ts`
- [ ] Validar permissoes SSH Hostinger por site para edicao de `.htaccess` (depublish-article)

## Cookies (idempotency: `cookies-12m-2026-04`)

- [ ] Revisar copy da PrivacyPolicy com Pedro (tabela cookies + revogacao)

## Husky / Branch Protection (idempotency: `husky-branch-protection-2026-04`)

- [ ] Rodar `npm install` para baixar `husky@^9.1.7` adicionado ao package.json
- [ ] Validar hooks `.husky/pre-commit` e `.husky/pre-push` localmente (`chmod +x` ja aplicado no commit)
- [ ] Aplicar branch protection rules em github.com/Pedrocorgnati/micro-sites/settings/branches conforme `.github/branch-protection.md`
- [ ] Configurar tag protection rule para `wave-*-*`

## Repo Bloat (idempotency: `repo-bloat-mensal-2026`)

- [ ] Executar `npx tsx scripts/branch-cleanup.ts` em dia 1 de cada mes (dry-run)
- [ ] `--apply` apos confirmar lista de branches arquivaveis
- [ ] Reavaliar Opcao B vs C em 2026-10

## Token Rotation (idempotency: `token-rotation-init-2026-04`)

- [ ] Inicializar campos `lastRotated: YYYY-MM-DD` em `.claude/projects/micro-sites.json > credentials.*` (cada token)
- [ ] Validar `npx tsx scripts/list-credentials-age.ts` apos init
- [ ] Configurar GitHub Action `credentials-age-check.yml` (workflow file ja criado)

## SF Endpoint Rotation (idempotency: `sf-endpoint-rotation-bootstrap-2026-04`)

- [ ] Documentar `access_key_previous` em `credentials.static_forms` schema (para rollback)
- [ ] Adicionar `lastRotated` na entrada SF

## Sales Enablement (idempotency: `sales-enablement-screenshots-2026-04`)

- [ ] Anexar `lighthouse-report-d01.png` (case-d01.md)
- [ ] Anexar `funnel-d01.png` (GA4 funnel D01)
- [ ] Coletar numeros reais 30+ leads para preencher `case-d01.md`

## SSL/DNS Monitoring (idempotency: `ssl-dns-watch-bootstrap-2026-04`)

- [ ] Criar `config/whois-domains.json` com lista de dominios .com.br/.com vigentes (Pedro)
- [ ] Configurar GitHub Variables `WHOIS_DOMAINS` (csv)
- [ ] Validar primeiro run manual: `npx tsx scripts/ssl-expiry-watch.ts` e `dns-expiry-watch.ts`

## OAB Compliance A04 (idempotency: `oab-a04-2026-04`)

- [ ] Pedro/cliente A04 fornecer numero da inscricao OAB para `legal-disclaimer.md`
- [ ] Validar disclaimer renderizado em `/termos` do A04 com cliente
- [ ] Apos publicacao, anexar print do disclaimer para registro de compliance

## LinkedIn (idempotency: `linkedin-drafts-2026-04`)

- [ ] Diagramar carrosseis F01-post-1 e F02-post-2 em Figma/Canva
- [ ] Coletar Lighthouse 100 screenshot real
- [ ] Agendar primeiros 4 posts em Buffer/Hootsuite

## GSC Bulk (idempotency: `gsc-bulk-2026-04`)

- [ ] Criar service account GCP com Search Console API + Site Verification API ativas
- [ ] Baixar JSON da SA, salvar em `secrets/gsc-service-account.json` (gitignored) localmente
- [ ] `base64 -w 0 secrets/gsc-service-account.json | gh secret set GSC_SERVICE_ACCOUNT_BASE64 --repo Pedrocorgnati/micro-sites`
- [ ] Decidir DNS_PROVIDER: `cloudflare` (recomendado, suportado) | `hostinger` (manual)
- [ ] Se Cloudflare: gerar API token com permissao "Zone DNS Edit" para os zones desta rede e setar `gh secret set DNS_API_TOKEN`
- [ ] Setar GitHub var `DNS_PROVIDER=cloudflare`
- [ ] Adicionar SA como Owner em cada GSC property (manual no console GSC) OU usar bulk-verify
- [ ] Rodar primeira execucao manual: `gh workflow run gsc-monthly-audit.yml -f run_bulk_verify=true`
- [ ] Validar relatorio em PR aberto pelo workflow

## LGPD runbook automation (idempotency: `lgpd-runbook-automation-2026-04`)

- [ ] Implementar `docs/compliance/lgpd-tickets/check-due.sh` (cron diario que escanea tickets `due_at - now < 3d` e envia email)
- [ ] Decidir webhook Static Forms para auto-acuso de `[LGPD]` no assunto
- [ ] Avaliar dashboard HTML estatico para tickets abertos (low-priority)

## Deploy lock (idempotency: `deploy-lock-2026-04`)

- [ ] Comunicar dev team sobre uso obrigatorio de `npx tsx scripts/dev-deploy-lock.ts acquire` antes de push em deploy-NN
- [ ] Documentar no DEV-JUNIOR-OFFBOARDING.md fluxo de release com lock
- [ ] Considerar Slack/email webhook de aviso quando lock e adquirido (low-priority)

## UptimeRobot threshold (idempotency: `uptime-threshold-2026-04`)

- [ ] Atualizar monitors existentes para threshold "2 falhas consecutivas" (formato `{contact_id}_2_0`)
- [ ] Conferir UPTIME-MONITORING.md secao "Threshold de alerta" com time

## D01 production URL (idempotency: `d01-production-url-2026-04`)

- [ ] Apontar dominio real para deploy-01 no Hostinger HPanel
- [ ] Configurar SSL (Let's Encrypt automatico no Hostinger)
- [ ] Atualizar `docs/operations/D01-PRODUCTION-URL.md` com URL real
- [ ] Atualizar `sites/d01-calculadora-custo-site/config.json` campo `siteUrl`
- [ ] Rodar primeira auditoria Lighthouse contra producao real e atualizar tabela do doc
- [ ] Registrar dominio no GSC via `/intake-review` bulk-verify (vide `gsc-bulk-2026-04`)
- [ ] Configurar Uptime monitor (vide UPTIME-MONITORING.md)
- [ ] Tirar screenshot full-page e anexar em `docs/operations/screenshots/d01-home-{YYYY-MM}.png`

## E2E matrix dependencies (idempotency: `e2e-matrix-2026-04`)

- [ ] Adicionar `http-server` em devDependencies do package.json (`npm i -D http-server@^14.1.1`)
- [ ] Validar `npm run e2e -- e2e/sites.matrix.spec.ts` localmente com 1-2 slugs antes de habilitar CI
- [ ] Considerar shard adicional no playwright (se runtime > 10min em CI por categoria)

## Waitlist counter (idempotency: `waitlist-counter-2026-04`)

- [ ] Decidir mode default: `manual` (Pedro preenche `output/reports/waitlist-counts-manual.json`) | `sf-api` (requer SF Pro) | `local` (so dev)
- [ ] Se sf-api: adicionar GitHub secret `SF_API_KEY` + var por slug `SF_FORM_ID_E01_*`
- [ ] Conferir primeiro PR aberto pelo workflow (toda segunda 06:00 UTC)
- [ ] Atualizar manualmente em `output/reports/waitlist-counts-manual.json` quando usar mode=manual

## WhatsApp bulk (idempotency: `whatsapp-bulk-2026-04`)

- [ ] Antes de rodar update-whatsapp-bulk em producao: testar com `--dry-run` primeiro
- [ ] Manter backup git commit antes do bulk update (script ja tem rollback automatico via .bak, mas commit e safety extra)

## SF endpoint segmentation (idempotency: `sf-segmentation-2026-04`)

- [ ] Criar 36+ endpoints reais em SF dashboard com nomes `{slug-prefix}-contato`, `{slug-prefix}-calc`, `{slug-prefix}-waitlist`
- [ ] Para cada endpoint, copiar URL e setar GitHub var `STATIC_FORMS_URL_<SLUG>_<TYPE>`
- [ ] Rodar `npx tsx scripts/segment-form-endpoints.ts --dry-run` para validar mapping antes
- [ ] Apos: `npx tsx scripts/segment-form-endpoints.ts` para persistir nos config.json

## Forms fallback Web3Forms (idempotency: `forms-fallback-2026-04`)

- [ ] Criar conta Web3Forms gratuita (`footstockbr@gmail.com`)
- [ ] Gerar 1 endpoint piloto e testar curl POST
- [ ] Documentar IDs em `secrets/web3forms-endpoints.json` (gitignored)
- [ ] Atualizar synthetic-monitor para suportar provider toggle

## Security headers (idempotency: `security-headers-2026-04`)

- [ ] Validar Hostinger Shared aceita `Header always set` e `RewriteCond %{HTTPS}`
- [ ] Apos primeiro deploy real: rodar `securityheaders.com` em 1 dominio e capturar score
- [ ] Considerar HSTS preload list (`hstspreload.org`) apos 6m estaveis em producao
- [ ] Aplicar bulk: `bash scripts/apply-htaccess-security.sh`

## SF backup + monitoring inventory (idempotency: `sf-backup-monitoring-2026-04`)

- [ ] Decidir mode SF backup: `manual` (Pedro exporta semanal do dashboard) | `api` (precisa SF Pro)
- [ ] Adicionar GitHub secret `SF_API_KEY` se mode=api
- [ ] Adicionar GitHub secret `UPTIMEROBOT_API_KEY` (read-only) para snapshot mensal
- [ ] Configurar branch protection para PRs de backup/snapshot (auto-merge se sem conflito)
- [ ] Rodar primeiro `sf-export-backup.ts --mode=manual` para criar arquivo manual baseline

## Branch ID reconciliation (idempotency: `branch-ids-2026-04`)

- [ ] Rodar `npx tsx scripts/audit-branch-ids.ts` apos primeiro deploy real
- [ ] Reconciliar divergencias INTAKE vs deploy-map.sh em BRANCH-ID-RECONCILIATION.md
- [ ] Atualizar INTAKE-CHECKLIST.md com IDs corretos do deploy-map

## Bot scraping (idempotency: `bot-scraping-2026-04`)

- [ ] SSH Hostinger e validar `apache2ctl -M | grep -i evasive`
- [ ] Configurar email notify do mod_evasive (testar SMTP `footstockbr@gmail.com`)
- [ ] Apos primeiro deploy: rodar curl loop para validar rate limiting
- [ ] Criar conta Cloudflare Free (preparar fase 2)

## KPI tracker + Wave 3 review (idempotency: `kpi-wave3-2026-04`)

- [ ] Criar `data/projects-closed.json` baseline com `{ "projects": [] }`
- [ ] Configurar `output/exports/sf-manual-export.json` baseline (Pedro export semanal)
- [ ] Rodar primeiro `npx tsx scripts/kpi-tracker.ts` apos 1 mes ao vivo
- [ ] Rodar Wave 3 final review checklist apos onda 3 ao vivo (vide WAVE-3-FINAL-REVIEW-CHECKLIST.md)

## 2FA + senha policy (idempotency: `2fa-policy-2026-04`)

- [ ] Habilitar 2FA em GitHub se ainda nao (Pedro)
- [ ] Habilitar 2FA em Google account com app authenticator
- [ ] Salvar 10 codigos backup do Google em 1Password tag `lgpd-recovery`
- [ ] Imprimir codigos backup + envelope lacrado
- [ ] Validar 1Password tem Emergency Kit impresso e guardado fisicamente
- [ ] Configurar `ORG_ADMIN_TOKEN` se rede virar org GitHub

## GSC fragility (idempotency: `gsc-fragility-2026-04`)

- [ ] Gerar codigos backup do Google account (vide cenario A do GSC-FRAGILITY-RUNBOOK)
- [ ] Adicionar exponential backoff em `gsc-submit-sitemaps.ts` (improvement; nao bloqueante)

## Social proof (idempotency: `social-proof-2026-04`)

- [ ] Criar diretorio `~/Documents/SystemForge/consents/` (fora do repo)
- [ ] Salvar template consent PDF em local acessivel (Pedro)
- [ ] Criar `data/social-proof.json` baseline com `{ "items": [] }`
