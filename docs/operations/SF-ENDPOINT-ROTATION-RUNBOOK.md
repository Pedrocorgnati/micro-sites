# Static Forms — Endpoint Rotation Runbook (CL-143)

**Origem:** TASK-9 / intake-review
**Aplicavel a:** todos os 36 sites (Cat A/C/D/F)
**Frequencia esperada:** 1-2x/ano ou ad-hoc

## Quando rotar

1. **Suspeita de comprometimento** — endpoint vazado em log/print/code commit publico
2. **Quota >80% sustentado por 7 dias** (alerta SF-quota.yml) e nao e possivel mitigar volume
3. **Mudanca de provedor** (ex: SF -> Web3Forms ou backend proprio)
4. **Reset trimestral** se a equipe tiver crescido (compartilhamento ampliado)

## Pre-checks

- [ ] Conta SF nova criada (ou mesma conta com novo endpoint)
- [ ] Testar endpoint via `curl` com payload minimo
- [ ] Confirmar quota mensal disponivel
- [ ] Janela de baixo trafego identificada (>=2h sem leads esperados)

## Procedimento

### Fase 1 — Preparacao (15min)

```bash
# 1. Atualizar credentials.ai_forge ou env file
# Substituir em .claude/projects/micro-sites.json > credentials.static_forms.access_key
# Manter access_key ANTIGA num campo backup `access_key_previous`

# 2. Atualizar src/lib/constants.ts (se aplicavel) ou env per-site
grep -rl "FORMS_ACCESS_KEY\|formAccessKey" sites/*/config.json | head
```

### Fase 2 — Build + deploy gradual (45-90min)

```bash
# Onda 1 — sites Cat C (3-4 sites): menor volume, baixo risco
SITE_SLUG=c01-... npm run build:site
SITE_SLUG=c02-... npm run build:site
# Deploy via .github/workflows/deploy.yml com workflow_dispatch
```

Aguardar 30min, validar:

```bash
npx tsx scripts/synthetic-form-submit.ts c01-...
# checar inbox SF dashboard novo endpoint
```

```bash
# Onda 2 — sites Cat A (advogado, dentista): volume medio
# Onda 3 — sites Cat D + F: maior volume
```

### Fase 3 — Validacao 24h

- [ ] Synthetic SF submit em pelo menos 5 sites: 200 OK
- [ ] Inbox novo endpoint recebe leads reais
- [ ] Inbox antigo NAO recebe novos leads (so legado)
- [ ] Nenhum aumento em `synthetic-form-submit-failure` (Sentry)

### Fase 4 — Arquivar antigo (apos 7 dias)

- [ ] Remover access_key antiga de `credentials.access_key_previous`
- [ ] Revogar endpoint antigo no SF dashboard
- [ ] Anotar em `docs/compliance/QUARTERLY-ACCESS-AUDIT.md` com data + motivo

## Rollback

Se Fase 2 detectar falha massiva:

```bash
# Reverter access_key no project.json para a backup
# Re-deploy ondas afetadas
git revert <commit-da-rotacao>
git push origin <deploy-branch>
```

## Observabilidade

- Alerta `SF-submission-failure-spike` em `config/alert-rules.json` ja captura >5 falhas/30min.
- Circuit breaker (`src/lib/circuit-breaker.ts`) abre apos 3 falhas locais — usuario nao perde lead, vai pro WA.

## PENDING-ACTIONS

Apos rotacao, registrar idempotency key:
- `sf-endpoint-rotation-{YYYY-MM}` com status DONE + commit hash
