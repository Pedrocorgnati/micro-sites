# Post-12-Month Site Evaluation

**Cadence:** trimestral (revisao continua); avaliacao formal aos 12, 18, 24 meses pos-launch
**Owner:** Pedro Corgnati
**Vincula:** `docs/operations/SUNSET-RUNBOOK.md`, `scripts/site-dormancy-watch.ts`

---

## Quando aplicar

| Idade do site | Acao |
|---------------|------|
| 0-6m | Investir, refinar, nao avaliar formalmente (estabilidade ainda construindo) |
| 6-12m | Primeira avaliacao informal — somente se sinais ruins |
| 12m | **Avaliacao formal** com este template |
| 12-18m | Decidir entre 4 caminhos abaixo |
| 24m | Re-avaliacao final |

## Os 4 caminhos

### A) Manter
**Quando:** trafego crescente, leads >= meta, conteudo ainda relevante
**Acao:** continuar publicacao, monitorar normalmente

### B) Refresh (rebrand parcial)
**Quando:** trafego estavel mas leads baixos, ou conteudo desatualizando
**Acao:**
- [ ] Refresh dos 3-5 artigos top performers
- [ ] Atualizar headline + CTA
- [ ] Revisar paleta/CTA mobile
- [ ] Re-rodar Lighthouse + ajustar performance

### C) Sunset
**Quando:** 2+ sinais de dormencia simultaneos por 90 dias
**Acao:** seguir `SUNSET-RUNBOOK.md`

### D) Migrar dominio
**Quando:** site funciona mas dominio nao representa o nicho
**Acao:** seguir `DOMAIN-MIGRATION-RUNBOOK.md`

## Checklist de avaliacao 12m

### Metricas
- [ ] Sessoes GA4 ultimos 30d: ___
- [ ] Sessoes GA4 media 6m: ___
- [ ] Impressoes GSC 30d: ___
- [ ] Cliques GSC 30d: ___
- [ ] Leads (form+calc) ultimos 6m: ___
- [ ] Custo Hostinger anual: ___ (alocado a este slot)

### Qualidade do conteudo
- [ ] Top 3 artigos ainda relevantes (data, regulacao, mercado)?
- [ ] Existe canibalizacao com outros sites da rede?
- [ ] Backlinks externos representativos?

### Decisao
- [ ] A — Manter
- [ ] B — Refresh
- [ ] C — Sunset
- [ ] D — Migrar dominio

### Acao
- [ ] Issue GitHub com label `evaluation-12m`
- [ ] Atualizar `config/SITES-REGISTRY.md` com decisao
- [ ] Atualizar `BUDGET.md` se mudanca de custo

## Output

Salvar avaliacao preenchida em `docs/operations/evaluations/{slug}-{YYYY-MM}.md`.
