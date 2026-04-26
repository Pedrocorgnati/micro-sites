# Static Forms — Runbook de Escalacao de Quota

**Owner:** Pedro Corgnati (controlador)
**Aplicavel a:** rede de 36 micro-sites em SF Free (50 submissions/mes)
**Idempotency:** `sf-quota-escalation-{YYYY-MM}`
**Vincula:** `config/alert-rules.json` regras `SF_QUOTA_70`, `SF_QUOTA_90`, `SF_DOWN_5MIN`

---

## Triggers

| Sinal | Acao |
|-------|------|
| Quota >70% (`SF_QUOTA_70`) | Avaliar tendencia. Se >50% w/w crescendo: planejar upgrade |
| Quota >90% (`SF_QUOTA_90`) | Iniciar escalacao IMEDIATA — ver passos abaixo |
| SF endpoint down (`SF_DOWN_5MIN`) | Ativar fallback Web3Forms — ver passos abaixo |

## Pre-checks

1. Rodar `npx tsx scripts/check-static-forms-quota.ts` para confirmar % real
2. Verificar se trafego e organico (GA4) ou bot (logs)
3. Confirmar que honeypot nao foi bypassed
4. Validar custo Pro: ~$10-15/mes

## Procedimento — Upgrade SF Pro

### 1. Comprar plano Pro
1. Login `staticforms.xyz/dashboard` com email Pedro (footstockbr@gmail.com)
2. Settings > Billing > Upgrade to Pro
3. Cartao registrado em conta Pedro
4. Confirmar email de billing chega em footstockbr@gmail.com

### 2. Atualizar secrets
- Sem mudanca de access_key se for upgrade dentro da mesma conta
- Caso contrario, atualizar `SF_ACCESS_KEY` em GitHub secret + `credentials.static_forms.access_key`

### 3. Validar
```bash
npx tsx scripts/synthetic-static-forms.ts
# Esperado exit 0 + log "OK — __SYNTHETIC_OK__"
```

### 4. Pos-upgrade
- [ ] Atualizar `config/alert-rules.json` thresholds (Pro: 1k/mes -> 70%/90% recalculados)
- [ ] Documentar custo mensal em `BUDGET.md`
- [ ] PR commitar mudanca em alert-rules e fechar issue de quota

---

## Procedimento — Fallback Web3Forms

### Quando usar
- SF Pro indisponivel
- Caso de emergencia (down >30min)
- Trade-off: Web3Forms tem 250 sub/mes free, multiplas keys facilitam segmentacao

### Setup inicial (uma vez)
1. Criar conta `web3forms.com` com email Pedro
2. Gerar access_key (chave por dominio se possivel)
3. Registrar em `credentials.web3forms.access_key`
4. Atualizar variavel CI `FORMS_ENDPOINT_FALLBACK_URL=https://api.web3forms.com/submit`

### Failover
```bash
# Atualizar GitHub vars
gh variable set FORMS_ENDPOINT_FALLBACK_URL --body "https://api.web3forms.com/submit"
gh secret set SF_ACCESS_KEY --body "<web3forms_key>"

# Re-deploy (forca re-build com nova env)
gh workflow run deploy.yml
```

### Rollback para SF
```bash
gh variable set FORMS_ENDPOINT_FALLBACK_URL --body "https://api.staticforms.xyz/submit"
gh secret set SF_ACCESS_KEY --body "<sf_key_original>"
gh workflow run deploy.yml
```

## Comunicacao

- Issue GitHub label `alert` aberta automaticamente
- Email para Pedro via Sentry/UptimeRobot Alert Rule
- Slack opcional (canal `#micro-sites-alerts`) — registrar webhook em PENDING-ACTIONS se decidir usar

## Pos-incidente

- [ ] Atualizar este runbook com licoes aprendidas
- [ ] Rodar `npx tsx scripts/check-static-forms-quota.ts --json` semanal por 4 semanas pos-resolucao
- [ ] Avaliar mudanca permanente de plano se quota Pro tambem se aproxima
