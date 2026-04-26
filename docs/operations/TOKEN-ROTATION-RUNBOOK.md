# Token Rotation — Runbook (CL-270, CL-480)

**Origem:** TASK-10 / intake-review
**Cadencia padrao:** anual (12 meses) — exceto onde indicado

## Inventario de tokens

| Token | Owner | Cadencia | Onde rotar | Onde atualizar |
|-------|-------|----------|------------|----------------|
| GitHub PAT (CI deploy) | Pedro | 12m | github.com/settings/tokens | `.claude/projects/micro-sites.json > credentials.github.token` + `gh secret set` |
| Vercel token | Pedro | 12m | vercel.com/account/tokens | (n/a — projeto usa Hostinger) |
| Hostinger SSH key | Pedro | 24m (par chave) | gerar com `ssh-keygen -t ed25519` | `credentials.ssh.private_key_path` + atualizar `~/.ssh/authorized_keys` no servidor |
| Hostinger SSH password | Pedro | 12m | hpanel Hostinger | `credentials.ssh.password` |
| GA4 Measurement Protocol Secret | Pedro | 12m | analytics.google.com -> Admin -> Data Streams | `credentials.analytics.ga4.measurement_protocol_secret` |
| Sentry Auth Token (uploads de sourcemap) | Pedro | 12m | sentry.io/settings/account/api/auth-tokens/ | `credentials.sentry.auth_token` + GitHub Action secret |
| Sentry DSN (RUNTIME) | Pedro | 24m ou ad-hoc | sentry.io project settings | `.env` (RUNTIME, NAO em credentials) |
| Static Forms access_key | Pedro | 12m ou ad-hoc | dashboard SF -> Settings | `credentials.static_forms.access_key` + sites/*/config.json |
| Tavily API key | Pedro | 12m | tavily.com/dashboard | `credentials.mcp_servers.tavily.api_key` |
| Perplexity API key | Pedro | 12m | perplexity.ai/account/api | `credentials.ai.perplexity.api_key` |
| Firecrawl API key | Pedro | 12m | firecrawl.dev/dashboard | `credentials.mcp_servers.firecrawl.api_key` |
| WhatsApp Business (n/a token, conta) | Pedro | n/a | n/a | n/a |
| Hostinger DNS API token (se aplicavel) | Pedro | 12m | hpanel API | `credentials.dns.hostinger.api_token` |

## Procedimento generico

1. **Pre-check:** confirmar que ninguem ativo no fluxo (build/deploy)
2. **Gerar novo token** no provedor (mantendo o antigo ativo por 24-72h)
3. **Atualizar credentials store:**
   - `/project-json --update credentials.{path}.value=NOVO_TOKEN`
   - Atualizar campo `lastRotated: YYYY-MM-DD`
4. **Atualizar secret manager** (GitHub Actions, Vercel env, etc.)
5. **Smoke test** — workflow / script que usa o token executa OK
6. **Revogar token antigo** apos 24-72h sem alertas

## Per-token notas

### GitHub PAT
```bash
# Usar fine-grained PAT, escopo so para o repo micro-sites
# Permissions: contents: write, deployments: write, pull-requests: write
gh secret set GITHUB_TOKEN --repo Pedrocorgnati/micro-sites --body "$NEW_TOKEN"
```

### Hostinger SSH key
```bash
# Local
ssh-keygen -t ed25519 -f ~/.ssh/hostinger_micro_sites_2026 -C "micro-sites@$(date -u +%Y-%m-%d)"
# Servidor
cat ~/.ssh/hostinger_micro_sites_2026.pub  # adicionar em ~/.ssh/authorized_keys via hpanel
# Apos validar, remover chave antiga do authorized_keys
```

### Sentry Auth Token
- Escopo minimo: `project:releases` (sourcemap upload)
- NAO usar `org:read` ou tokens com `project:write` em CI

## Tracking de idade

Script `scripts/list-credentials-age.ts` percorre `credentials.*.lastRotated` e
alerta tokens >12m.

```bash
npx tsx scripts/list-credentials-age.ts
# Saida: tabela com colunas Token | lastRotated | Idade (dias)
# Exit 1 se algum >365 dias
```

## Workflow automatizado

`.github/workflows/credentials-age-check.yml` roda mensalmente e abre
issue se algum token expirar.

## PENDING-ACTIONS

- `token-rotation-init-2026-04`: inicializar campos `lastRotated` em todos credentials
- `token-rotation-annual-{YYYY}`: lembrete anual (criar via cron de project)
