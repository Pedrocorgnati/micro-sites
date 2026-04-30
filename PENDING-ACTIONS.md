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

---

## AdSense + SelfAd Fallback (idempotency: `adsense-self-ads-2026-04-28`)

### A. Conta Google AdSense (publisher)

- [ ] Criar conta AdSense em https://www.google.com/adsense/start/ usando email principal
- [ ] Verificar identidade (CPF, endereco residencial, conta bancaria PJ ou PF)
- [ ] Submeter os 36 dominios da rede para review (lista em `sites/*/config.json`)
- [ ] Aguardar aprovacao (1-14 dias por dominio; alguns podem ser reprovados por baixo conteudo)
- [ ] Apos aprovacao, anotar **publisher ID** `ca-pub-XXXXXXXXXXXXXXXX` (16 digitos)
- [ ] Setar env `NEXT_PUBLIC_ADSENSE_CLIENT_ID` no secret manager (Hostinger/Vercel/Railway)
- [ ] Setar `NEXT_PUBLIC_APP_ENV=production` apenas em producao final (staging/dev = qualquer outro)
- [ ] Decidir modelo: `NEXT_PUBLIC_ADSENSE_PERSONALIZATION = npa | personalized | off` (default sugerido: `npa`)

### B. Ad units (slots) por dominio

Para cada dominio aprovado, criar 4 ad units no painel AdSense:
- `header` (Display Ads, Responsive)
- `inArticle` (In-feed Ads ou Display Responsive)
- `sidebar` (Display Ads, Responsive — desktop only)
- `footer` (Display Ads, Responsive)

- [ ] Anotar os 4 slot IDs (10 digitos cada) por site
- [ ] Popular `sites/{slug}/config.json > adsense.slots` com os IDs reais
- [ ] (Opcional, sites Cat A) revisar `config.adsense.routesAllowed` — default `[]` mantem so rotas hard-allowed

### C. Banners proprios — fallback (10 imagens)

Local: `public/self-ads/`. Manifest completo em `public/self-ads/MANIFEST.md`.

**Marca 1 — Pedro Corgnati (https://www.corgnati.com)**
- [ ] `corgnati-728x90.webp` — 728×90 px (header/footer desktop, leaderboard)
- [ ] `corgnati-320x100.webp` — 320×100 px (header/footer mobile)
- [ ] `corgnati-336x280.webp` — 336×280 px (inArticle desktop, large rectangle)
- [ ] `corgnati-300x250.webp` — 300×250 px (inArticle mobile, medium rectangle)
- [ ] `corgnati-300x600.webp` — 300×600 px (sidebar, half page)

**Marca 2 — Forja de Sistemas (https://forjadesistemas.com.br)**
- [ ] `forjadesistemas-728x90.webp` — 728×90 px (header/footer desktop)
- [ ] `forjadesistemas-320x100.webp` — 320×100 px (header/footer mobile)
- [ ] `forjadesistemas-336x280.webp` — 336×280 px (inArticle desktop)
- [ ] `forjadesistemas-300x250.webp` — 300×250 px (inArticle mobile)
- [ ] `forjadesistemas-300x600.webp` — 300×600 px (sidebar)

**Diretrizes:**
- Formato WebP qualidade 85, dimensoes EXATAS (pixel-perfect)
- Texto legivel ≥ 14px equivalente em viewport 320px
- Contraste WCAG AA (4.5:1) entre texto e fundo
- CTA explicito (botao ou seta)
- Sem cores conflitando com paleta dos 36 sites (preferir neutros + 1 accent da brand)
- Ja existem placeholders gerados (1-2KB cada) que NAO devem ir pra producao

### D. RIPD + jurídico (idempotency: `adsense-ripd-2026-04`)

- [ ] Revisar `docs/legal/RIPD-ADSENSE.md` com DPO/jurídico antes de producao
- [ ] Revisar texto da `PrivacyPolicy.tsx` (transferencia internacional, parceiros)
- [ ] Atualizar `docs/compliance/ROPA.md` com novo tratamento (publicidade)
- [ ] Decisao formal: assinar/aprovar RIPD na secao 7

### E. Pos-deploy (idempotency: `adsense-postdeploy-2026-04`)

- [ ] Rodar Lighthouse em 5 sites amostrais ANTES do go-live (baseline)
- [ ] Apos go-live, monitorar painel AdSense por 7 dias (impressions, CTR, policy violations)
- [ ] Validar manualmente com Google Publisher Toolbar em 5 sites (1 por categoria A-F)
- [ ] Auditoria de cookies pos-go-live (`docs/legal/RIPD-ADSENSE.md` §2.1; atualizar `CookiesTable.tsx`)
- [ ] Comparar Lighthouse Performance/CLS/LCP pos vs baseline (regressao tolerada ≤ 10pts)

### F. Validacoes automaticas em CI (idempotency: `adsense-ci-2026-04`)

- [ ] Adicionar `npm run smoke:adsense` ao pipeline de CI (depois do build)
- [ ] CI deve falhar se `NEXT_PUBLIC_APP_ENV=production` E `NEXT_PUBLIC_ADSENSE_CLIENT_ID` ausente
- [ ] (Opcional) Adicionar Playwright spec de consent flow ao CI


---

## Blog Daily Routine (idempotency: `blog-daily-2026-04-28`)

### Classificacao de prioridade
- **P0 (bloqueia soft-launch):** secoes A, B, C, D.1
- **P1 (bloqueia full launch):** secoes D.2, D.3, E
- **P2 (manutencao continua):** secao F

### A. Validacoes humanas (P0)

- [ ] Revisar `groups.json` (6 grupos × 6 sites) em `.claude/blog/data/global/groups.json` e validar mapping
- [ ] Confirmar hubs propostos por grupo: a01, a07, b01, c01, d04, f01
- [ ] Aprovar `BLOG-DAILY-STRATEGY.md` em `scheduled-updates/micro-sites/`

### B. Geracao de master-strategies (5 grupos pendentes)

- [ ] G1 (saude/YMYL) — `/blog:init-strategy --group G1` (atencao: outboundLinkPolicy=fontes_governamentais)
- [ ] G2 (profissionais liberais) — `/blog:init-strategy --group G2`
- [ ] G3 (PME pre-digital) — `/blog:init-strategy --group G3`
- [ ] G4 (PME pos-decisao) — `/blog:init-strategy --group G4`
- [ ] G5 (ferramentas/avaliacao) — `/blog:init-strategy --group G5`

**Custo Tavily — atencao a ambiguidade:**
- O comando `/blog:init-strategy` faz `~5-15 buscas` por execucao em modo basic (1 credito cada). Plano pay-as-you-go: $0.008/credito.
- Estimativa REAL: ~$0.04-$0.12/grupo executando init-strategy.
- A estimativa anterior de "$0.50/grupo" assumia execucao completa de `expand-keywords` (~90 buscas). Confirmar com o operador qual modo sera usado.
- Total estimado conservador: $0.50-$3 para os 5 grupos. [Tavily docs](https://docs.tavily.com/documentation/api-credits)

### C. Geracao de prioritized-topics (queues iniciais — P0)

**Threshold operacional:** minimo 30 topics por queue antes do schedule (validate-state warning < 30). Com 1 consumo/dia/grupo, 30 = 30 dias de cobertura.

Apos master-strategy de cada grupo:
- [ ] G1 queue.json — `/blog:expand-keywords --group G1` (validar **>= 30 itens**)
- [ ] G2 queue.json — `/blog:expand-keywords --group G2` (>= 30)
- [ ] G3 queue.json — `/blog:expand-keywords --group G3` (>= 30)
- [ ] G4 queue.json — `/blog:expand-keywords --group G4` (>= 30)
- [ ] G5 queue.json — `/blog:expand-keywords --group G5` (>= 30)
- [ ] **G6 queue.json — EXISTE com 10 itens, expandir para >= 30** via `/blog:expand-keywords --group G6`

### D. Setup routine no painel claude.ai/code/routines

#### D.1 — Gates pre-schedule (P0, obrigatorio)
- [ ] `node .claude/blog/lib/validate-state.mjs` retorna 0 erros
- [ ] `BLOG_SMOKE_STRICT=1 node .claude/blog/lib/smoke-test.mjs` retorna 10/10 com 0 warnings
- [ ] Manualmente: ler ultima linha de `.claude/blog/data/global/registry.json` e confirmar `storiesPublished: 0` (clean state)

#### D.2 — Soft launch: 2 grupos nao-YMYL primeiro (P1)

Razao: G1 (saude) e YMYL — risco de penalizacao se canonical/conteudo nao estiver perfeito. Testar com G6 (tech) + G4 (PME) primeiro.

- [ ] Mover queue.json de G1, G2, G3, G5 para `queue.json.disabled` temporariamente
  ```bash
  for g in G1 G2 G3 G5; do
    mv .claude/blog/data/groups/$g/prioritized-topics/queue.json .claude/blog/data/groups/$g/prioritized-topics/queue.json.disabled
  done
  ```
- [ ] Routine vai pular G1/G2/G3/G5 (queue ausente = warn, mas nao aborta single-group; o caller decide)
- [ ] Run now manual deve produzir 12 artigos (2 hubs + 10 spokes — apenas G4 + G6)
- [ ] Monitorar 7 dias antes de Full launch

#### D.3 — Full launch (apos soft OK)
- [ ] Restaurar queues: `mv queue.json.disabled queue.json` em G1/G2/G3/G5
- [ ] Adicionar repo `Pedrocorgnati/micro-sites` (working dir: raiz)
- [ ] Configurar env vars:
  - `GITHUB_TOKEN` (push + abrir issue)
  - `TAVILY_API_KEY` (search primario)
  - `FIRECRAWL_API_KEY` (extracao concorrentes)
  - `PERPLEXITY_API_KEY` (fallback)
- [ ] Permitir push apenas para `main`
- [ ] Colar `[ROUTINE PROMPT]` de `.claude/routines/blog-daily.md`
- [ ] Schedule: 1× ao dia, 12:00 UTC (09:00 BRT)
- [ ] **Run now manual** antes de ativar schedule

### E. Monitoramento pos-go-live (primeiros 7 dias)

- [ ] Validar primeiro batch de 36 artigos: 6 hubs + 30 spokes publicados
- [ ] GSC `site:{hub_domain}/blog/` confirma indexacao do hub
- [ ] GSC `site:{spoke_domain}/blog/` confirma BAIXA indexacao spokes (esperado, canonical resolve)
- [ ] Console: zero violations de canonical "Google chose different canonical"
- [ ] Painel AdSense: hubs comecam a registrar impressoes nos primeiros 3-7d

### F. Manutencao mensal

- [ ] Dia 1 de cada mes: `/blog:expand-keywords --group {Gn}` para cada grupo (refresh delta)
- [ ] Audit semanal de paridade — `node .claude/blog/lib/validate-state.mjs --queues`
- [ ] Audit semanal de quality gate fail rate (relatorios em `.claude/routine-reports/`)
