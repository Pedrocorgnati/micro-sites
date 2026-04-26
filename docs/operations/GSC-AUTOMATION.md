# GSC Automation — Submissao em Batch + Bulk Verify + Auditoria Mensal

**Versao:** v1.1 (2026-04-25 — TASK-14 bulk verify + checklist + workflow mensal)

## Objetivo
Automatizar submissao de sitemaps + verificacao DNS + auditoria mensal de 36 propriedades GSC.

## Pre-requisitos
- Service account GCP com Search Console API e Site Verification API habilitadas
- JSON da service account em `secrets/gsc-service-account.json` (gitignored)
- Cada dominio claim no GSC ou via bulk-verify
- DNS provider com API: **Cloudflare** (suportado) | Hostinger (registrar manualmente)

## Scripts disponiveis

### 1. Submissao de sitemaps (existente)

```bash
export GSC_CREDENTIALS=secrets/gsc-service-account.json
npx tsx scripts/gsc-submit-sitemaps.ts
```

Saida: log por site com status `ok` ou `fail: <erro>`. Exit code 2 se houver falhas.

### 2. Bulk Verify via DNS TXT (novo — TASK-14)

```bash
export GSC_CREDENTIALS=secrets/gsc-service-account.json
export DNS_PROVIDER=cloudflare
export DNS_API_TOKEN=...
npx tsx scripts/gsc-bulk-verify.ts [--dry-run] [--site <slug>]
```

Fluxo:
1. Para cada site, obtem `verificationToken` via Site Verification API
2. Cria TXT record `<dominio> TXT google-site-verification=<token>` via DNS API
3. Aguarda propagacao (default 5 min — ajustar via `DNS_PROPAGATION_WAIT_MS`)
4. Submete `webResource.insert` para GSC verificar
5. Resultado por site: `verified | pending | failed | skipped`

Saida: stdout JSON + `output/reports/gsc-bulk-verify-<date>.md`

### 3. Checklist de propriedades (novo — TASK-14)

```bash
export GSC_CREDENTIALS=secrets/gsc-service-account.json
npx tsx scripts/gsc-properties-checklist.ts
```

Cruza `sites/*/config.json` com lista do GSC. Saida:
- `output/reports/gsc-properties-status.md` (markdown legivel)
- `output/reports/gsc-properties-status.json` (consumivel por outros scripts)

## Escopo OAuth
- `https://www.googleapis.com/auth/webmasters` (sitemaps.submit, sites.list)
- `https://www.googleapis.com/auth/webmasters.readonly` (apenas listagem)
- `https://www.googleapis.com/auth/siteverification` (insert + getToken)

## Workflow mensal automatizado

`.github/workflows/gsc-monthly-audit.yml`:
- Cron `0 9 1 * *` (dia 1 de cada mes 09:00 UTC)
- Roda checklist + opcionalmente bulk-verify
- Abre PR `gsc/monthly-audit-<run-id>` com relatorio atualizado
- Secrets necessarios em GitHub Settings > Secrets:
  - `GSC_SERVICE_ACCOUNT_BASE64` (base64 do JSON)
  - `DNS_API_TOKEN` (se bulk-verify)
- Vars opcionais:
  - `DNS_PROVIDER` (default `cloudflare`)

## Rotacao de secret
1. Criar nova key na service account GCP
2. Baixar JSON
3. `base64 -w 0 secrets/gsc-service-account.json | gh secret set GSC_SERVICE_ACCOUNT_BASE64`
4. Substituir local em `secrets/gsc-service-account.json`
5. Remover key antiga do IAM apos validacao

## Agendamento sugerido
- Cron mensal: auditoria + checklist (workflow `gsc-monthly-audit.yml`)
- Cron semanal: re-submit sitemaps (rodar `gsc-submit-sitemaps.ts` em workflow separado)
- Apos cada deploy de conteudo novo: roda ad-hoc `gsc-submit-sitemaps.ts`

## Acoes humanas pendentes

Vide `PENDING-ACTIONS.md` bloco `gsc-bulk-2026-04`:
- Criar service account com Site Verification API
- Configurar `GSC_SERVICE_ACCOUNT_BASE64` no GitHub
- Decidir DNS_PROVIDER (Cloudflare recomendado; Hostinger requer manual)
- Se Cloudflare: criar API token com permissao `Zone DNS Edit`

## Troubleshooting

| Sintoma | Causa provavel | Acao |
|---|---|---|
| `pending` por mais de 1h | TXT nao propagou | `dig +short TXT <dominio>`; se ausente, recriar |
| `skipped: credentials ausentes` | `secrets/gsc-service-account.json` nao existe | Decode do `GSC_SERVICE_ACCOUNT_BASE64` ou copiar local |
| `failed: GSC nao retornou token` | Site nao registrado na Site Verification API | Adicionar no GSC manualmente primeiro |
| Hostinger DNS_PROVIDER falha | Sem API estavel | Adicionar TXT pelo painel HPanel; depois rodar verify isolado |
