# Capacity Overflow Runbook

**Versao:** v1.0 (2026-04-25 — TASK-24 ST003 / CL-296)
**Vincula:** REPO-BLOAT-MITIGATION, SF-QUOTA-ESCALATION-RUNBOOK, WHATSAPP-SCALING-RUNBOOK, BUDGET.md

> Este runbook define os tres principais gatilhos de "volume excede capacidade" da rede de 36 micro-sites e a acao imediata + escalacao para cada um. Pedro como operador unico precisa de gatilhos auto-detectaveis para evitar surpresa.

---

## Gatilhos canonicos

| # | Gatilho | Sinal/threshold | Onde detectar | Acao imediata | Escalacao se persistir |
|---|---|---|---|---|---|
| 1 | **Lead overload (Pedro overload)** | >30 leads/mes sustentado por 2 meses consecutivos | GA4 conversion events + SF dashboard mensal | Ativar nurture automatizado (email + WhatsApp template). Reduzir CTAs F01 nos 5 sites mais agressivos. | Contratar VA part-time para qualificacao L1 (vide PIPEDRIVE-MIGRATION-DECISION) |
| 2 | **Hostinger storage** | >70% do quota (250GB shared) | `scripts/monitor-hostinger-storage.ts` (post-deploy step do `deploy.yml`) | Rodar `scripts/branch-cleanup.ts` + purge `dist/` antigos > 30 dias. Comprimir PDFs com qpdf. | Migrar para Hostinger Business (500GB) ou consolidar dominios no Cloudflare R2 |
| 3 | **Build time CI** | Workflow `deploy.yml` > 15 min sustentado por 3 runs | GitHub Actions metrics | Reduzir scope de builds (skip OG em PR; rodar full so em deploy). Habilitar cache `node_modules` mais agressivo. | Migrar para Vercel ou self-hosted runner com SSD; considerar Turborepo |

---

## Gatilho 1 — Lead overload

### Sinais

- **GA4:** `contact_form_submit` events count > 30/site Cat D em mes corrente
- **SF dashboard:** total submissions cross-site > 60/mes
- **Caixa email Pedro:** > 5 leads/dia nao respondidos em 24h por 3 dias consecutivos

### Acao imediata (semana 1)

```bash
# 1. Auditar quais sites estao gerando o pico
npx tsx scripts/audit-conversion-by-site.ts --month=$(date +%Y-%m)

# 2. Consultar configurations dos top-3 sites
for slug in $(top3); do
  cat sites/$slug/config.json | jq '.cta'
done

# 3. Reduzir agressividade CTAs F01 nos top-3 (ajustar copy)
# 4. Ativar autoresponder no SF (configurar em SF dashboard)
```

### Escalacao

- **Trigger:** lead-overload sustentado por 2 meses
- **Decisao:** contratar VA (R$ 2k-3k/mes) para qualificacao L1
- **Doc:** abrir issue `runbook/capacity-overflow-{YYYY-MM}` com numeros mensais
- **Alternativa:** subir para Pipedrive Free (vide PIPEDRIVE-MIGRATION-DECISION)

---

## Gatilho 2 — Hostinger storage

### Sinais

- `output/storage-report.json` artifact em deploy.yml com `usage_pct > 70`
- 503 errors no Hostinger durante deploy (sintoma de storage cheio)

### Acao imediata (mesma janela de deploy)

```bash
# 1. Rodar cleanup de branches deploy-NN antigos
npx tsx scripts/branch-cleanup.ts --execute

# 2. Purgar dist/ antigos no servidor
ssh -p 65002 user@hostinger 'find ~/public_html -name "dist-*" -mtime +30 -exec rm -rf {} \;'

# 3. Comprimir PDFs grandes
find sites/*/public -name "*.pdf" -size +1M -exec qpdf --object-streams=generate {} {}.compressed \;

# 4. Re-checar storage
npx tsx scripts/monitor-hostinger-storage.ts
```

### Escalacao

- **Trigger:** storage > 85% apos cleanup, OU 2 alertas storage em 30 dias
- **Decisao:** migrar para Hostinger Business (R$ 30/mes a mais, +250GB)
- **Alternativa medio prazo:** Cloudflare R2 para assets estaticos (PDFs, OG images)

---

## Gatilho 3 — Build time CI

### Sinais

- `deploy.yml` runtime > 15min sustentado em 3 runs consecutivos
- `lighthouse-ci.yml` falhando timeout

### Acao imediata

1. Verificar quais steps consomem tempo: GitHub Actions UI -> step durations
2. Aplicar otimizacoes:
   - `actions/setup-node@v4` ja faz cache de `~/.npm` — confirmar habilitado
   - Build incremental: usar `git diff` para skipar sites nao tocados (ja existe `steps.changes`)
   - `--skip-og` em PRs (apenas full em deploy-NN merge)
   - Lighthouse com retry (vide TASK-16) — evita re-run completo

### Escalacao

- **Trigger:** build > 25min em 5 runs OU custo GitHub minutes > limite gratuito
- **Decisao:** self-hosted runner em VPS (Hostinger VPS R$ 30/mes) OU Vercel para Cat D
- **Alternativa:** Turborepo para build cache compartilhado entre sites

---

## Sinais agregados — alerta global

Cron mensal pode rodar `scripts/audit-capacity.ts` (a implementar em iteracao
futura) consolidando os 3 gatilhos. Se 2+ gatilhos amarelos no mesmo mes,
abrir issue de revisao do plano de scaling.

## Cross-references

- TASK-8 (REPO-BLOAT-MITIGATION) — bloat de branches/IDs
- TASK-9 (PIPEDRIVE-MIGRATION-DECISION) — quando trocar SF por Pipedrive
- WHATSAPP-SCALING-RUNBOOK — quando WA pessoal nao escala
- SF-QUOTA-ESCALATION-RUNBOOK — quando SF gratuito nao escala

## Versionamento

- v1.0 (2026-04-25) — TASK-24 ST003: 3 gatilhos canonicos com acao + escalacao
