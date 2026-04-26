# Sentry Token Rotation Runbook

**Owner:** Pedro Corgnati (controlador)
**Cadence:** anual + sob suspeita de comprometimento
**Idempotency key:** `sentry-rotate-{YYYY-Q}`

---

## Quando rotacionar

- Anual (Q1 de cada ano civil) — preventivo
- Suspeita de vazamento (token logado em CI publico, repo publico, mensagem)
- Saida de colaborador com acesso ao Sentry
- Migracao de conta/organizacao Sentry

## Pre-checks

1. Confirmar acesso a Sentry org como Owner
2. Validar que `credentials.sentry.auth_token` existe em `.claude/projects/{slug}.json`
3. Identificar consumidores do token: GitHub Actions secrets, scripts CLI locais, runbooks

## Procedimento

### 1. Gerar novo token
1. Sentry > Settings > Account > User Auth Tokens
2. Criar token com scopes minimos: `org:read`, `project:releases`, `project:write`
3. Copiar valor (mascarar em logs: `sntrys_...***...`)

### 2. Atualizar storages
```bash
# Atualizar project.json (ORCH)
/project-json --update credentials.sentry.auth_token=<novo>

# Atualizar GitHub secret
gh secret set SENTRY_AUTH_TOKEN --body "<novo>"

# Validar
gh secret list | grep SENTRY_AUTH_TOKEN
```

### 3. Smoke test
```bash
SENTRY_AUTH_TOKEN=<novo> npx tsx scripts/sentry-quota-check.ts --json
# Esperar exit 0 e payload com `used`, `quota`, `status`
```

### 4. Revogar token antigo
1. Sentry > Settings > Account > User Auth Tokens
2. Revoke no token anterior
3. Confirmar workflow `sentry-quota` rodando com sucesso (ultimo run verde)

## Pos-checks

- [ ] Workflow `Sentry Quota Watch` proxima execucao verde
- [ ] Sourcemap upload em `deploy.yml` continua funcionando
- [ ] Issue de quota aberta sob threshold antigo verificada
- [ ] PENDING-ACTIONS atualizado com `idempotency: sentry-rotate-{YYYY-Q}`

## Rollback

Se token novo nao funciona em CI:
1. Restaurar GitHub secret com valor antigo (nao revogar ainda)
2. Investigar scopes do token novo
3. Repetir Geracao com scopes corretos
