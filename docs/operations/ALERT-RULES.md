# Alert Rules — Taxonomia Canonica

**Fonte de verdade:** `config/alert-rules.json` (validado por Zod em `src/schemas/alert-rules.ts`)
**Owner default:** `footstockbr@gmail.com`
**Cadence revisao:** trimestral
**Idempotency:** `alert-rules-v{version}`

---

## Tabela canonica

| ID | Descricao | Metric | Threshold | Window | Channel | Severity | Runbook |
|----|-----------|--------|-----------|--------|---------|----------|---------|
| `SF_QUOTA_70` | SF quota >70% | `static_forms.submissions.monthly_pct` | `>= 0.7` | 30d | github_issue+email | warning | SF-QUOTA-ESCALATION-RUNBOOK |
| `SF_QUOTA_90` | SF quota >90% | idem | `>= 0.9` | 30d | github_issue+email+sentry | critical | SF-QUOTA-ESCALATION-RUNBOOK |
| `SF_DOWN_5MIN` | SF endpoint down >=5min | `synthetic.static_forms.consecutive_failures` | `>= 1` | 5m | github_issue+email | critical | SF-QUOTA-ESCALATION-RUNBOOK |
| `SF_SUBMISSION_DROP_W2W` | Subs semanais <70% media 4W | `static_forms.submissions.weekly_vs_4w_avg` | `< 0.7` | 7d | github_issue+email | warning | — |
| `GSC_INDEX_DROP_20PCT` | Indexacao GSC -20% w/w | `gsc.indexed_urls.wow_delta` | `<= -0.2` | 7d | github_issue+email | warning | — |
| `SENTRY_ERROR_SPIKE` | Erros >=50/dia | `sentry.errors.daily_count` | `>= 50` | 24h | sentry+email | warning | SENTRY-ROTATION-RUNBOOK |
| `GA4_CALC_COMPLETION_DROP` | Conclusao calc -25% | `ga4.calculator_completion_rate.vs_4w` | `<= -0.25` | 7d | github_issue+email | warning | — |
| `UPTIME_DOWN_3MIN` | Site down >=3min | `uptime.consecutive_down_minutes` | `>= 3` | 5m | uptimerobot+email | critical | MONITORING-RUNBOOK |
| `SSL_EXPIRY_30D` | SSL expira <=30d | `ssl.days_to_expiry` | `<= 30` | 1d | github_issue+email | warning | DOMAIN-SETUP |
| `WA_DEEP_LINK_BROKEN` | WhatsApp deep link broken | `synthetic.whatsapp.broken_count` | `>= 1` | 1d | github_issue+email | warning | — |

---

## Como adicionar regra

1. Editar `config/alert-rules.json` com novo objeto em `rules[]`
2. Garantir que `id` e SCREAMING_SNAKE_CASE unico
3. Rodar `npx tsx -e "require('./src/schemas/alert-rules.ts').loadAlertRules()"` para validar Zod
4. Atualizar tabela acima
5. Implementar coleta da `metric` se nova
6. PR com etiqueta `alert-rules`

## Como deprecar regra

1. Marcar `severity: 'info'` + `description: '[DEPRECATED] ...'` por 1 trimestre
2. Apos quarentena, remover do JSON e do `.github/workflows/synthetic-monitors.yml`
