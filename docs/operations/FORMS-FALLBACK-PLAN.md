# Forms Fallback Plan — Static Forms downtime/quota

**Versao:** v1.0 (2026-04-25 — TASK-20 ST003 / CL-534, CL-535)
**Vincula:** SF-QUOTA-ESCALATION-RUNBOOK, SF-ENDPOINT-ROTATION-RUNBOOK, PIPEDRIVE-MIGRATION-DECISION

> Plano formal de migracao para um provedor de fallback caso Static Forms
> (`staticforms.xyz`) fique indisponivel por mais de 24h ou atinja >90% da
> quota gratuita (200 submissions/m).

---

## Comparativo de provedores

| Criterio | Static Forms (atual) | Web3Forms (fallback escolhido) | Formspree |
|---|---|---|---|
| Plano gratuito | 200 sub/m | **1000 sub/m** | 50 sub/m |
| Plano pago basico | $10/m (Pro 1k) | $0 (gratuito ja generoso) | $10/m (Basic 100) |
| Anti-spam | Honeypot + reCAPTCHA opt | Honeypot + Cloudflare Turnstile builtin | Honeypot + reCAPTCHA |
| LGPD/GDPR | DPA via SCC | DPA via SCC + servidores EU | DPA via SCC |
| Custom redirect | Sim | Sim | Sim |
| Webhook | Sim | Sim | Sim |
| Setup time | 5min/endpoint | **3min/endpoint** | 5min/endpoint |
| Multi-endpoint | $1/endpoint Pro | **incluido no free** | $1/form Basic |

**Decisao:** **Web3Forms** como fallback canonico (`https://api.web3forms.com/submit`).

Motivos: quota gratuita 5x maior, Turnstile builtin (sem precisar key Google), suporte multi-endpoint sem custo extra.

---

## Gatilhos de migracao

### Gatilho A — SF down >24h

- **Sinal:** synthetic monitor `synthetic-monitor-static-forms.ts` falha 24h+
- **Detectado por:** workflow `synthetic-monitors.yml` (ja existente — TASK-3)
- **Acao:** trocar `STATIC_FORMS_URL` env para Web3Forms em todos os deploys ativos

### Gatilho B — Quota >90%

- **Sinal:** SF dashboard mostra >180/200 submissions no mes
- **Detectado por:** workflow `static-forms-quota.yml` (ja existente — TASK-3)
- **Acao:** migrar para Web3Forms (free 1k) OU contratar SF Pro (decisao em SF-QUOTA-ESCALATION)

### Gatilho C — Spam >5% submissions

- **Sinal:** audit manual mensal — taxa de spam > 5% mesmo com honeypot
- **Acao:** migrar para Web3Forms (Turnstile builtin) ou contratar reCAPTCHA Enterprise

---

## Migration steps (Web3Forms)

### Pre-migracao (preparar antes do gatilho)

- [ ] Criar conta gratuita em web3forms.com (`footstockbr@gmail.com`)
- [ ] Gerar 36 endpoints (1 contato/site + 5 calc + 12 waitlist Cat E)
- [ ] Testar 1 endpoint em D01 staging (curl POST + verificar email)
- [ ] Documentar IDs em `secrets/web3forms-endpoints.json` (gitignored)

### Migracao (durante gatilho)

```bash
# 1. Atualizar GitHub vars com novo provider
gh variable set STATIC_FORMS_URL --body "https://api.web3forms.com/submit"
gh variable set FORMS_PROVIDER --body "web3forms"

# 2. Atualizar secrets para acceso por slug
for slug in $(ls sites/ | grep -v _template); do
  ENDPOINT_ID=$(jq -r ".\"$slug\".contact" secrets/web3forms-endpoints.json)
  if [ -n "$ENDPOINT_ID" ]; then
    KEY="STATIC_FORMS_URL_$(echo $slug | tr '[:lower:]-' '[:upper:]_')_CONTACT"
    gh variable set $KEY --body "https://api.web3forms.com/submit?access_key=$ENDPOINT_ID"
  fi
done

# 3. Trigger deploy de todos os sites
gh workflow run deploy.yml --ref main -f force_full_rebuild=true
```

### Pos-migracao

- [ ] Validar via `synthetic-monitor-static-forms.ts` (renomear para `synthetic-monitor-forms.ts`)
- [ ] Rodar smoke pos-deploy
- [ ] Comunicar mudanca em LGPD-SLA + atualizar ROPA (operador trocou)
- [ ] Manter SF como secondary por 30 dias antes de cancelar

---

## Rollback

Se Web3Forms apresentar problemas pos-migracao:

1. Reverter `STATIC_FORMS_URL` GitHub var para `https://api.staticforms.xyz/submit`
2. Re-deploy sites
3. Documentar incidente em `docs/compliance/lgpd-incidents/`

## Custos estimados

| Cenario | Provider | Custo/mes |
|---|---|---|
| Atual (200 sub/m) | SF Free | R$ 0 |
| Pico (500 sub/m) | Web3Forms Free | R$ 0 |
| Crescimento (1500 sub/m) | Web3Forms Pro | $10 ≈ R$ 50 |
| Redundancia (SF+W3F) | Ambos free | R$ 0 |

## Acoes humanas pendentes

Vide PENDING-ACTIONS bloco `forms-fallback-2026-04`:

- [ ] Criar conta Web3Forms (`footstockbr@gmail.com`)
- [ ] Gerar primeiro endpoint piloto e testar
- [ ] Documentar IDs em `secrets/web3forms-endpoints.json`
- [ ] Atualizar synthetic monitor para suportar provider toggle

## Versionamento

- v1.0 (2026-04-25) — TASK-20 ST003: plano formal de fallback Web3Forms
