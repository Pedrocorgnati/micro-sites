# Content Refresh Schedule — Calendario Trimestral

## Objetivo
Manter 36 sites com conteudo fresco para SEO e trust signals.

## RACI
- **R** (Responsavel): Pedro / agente AI
- **A** (Approver): Pedro
- **C** (Consultado): dados GA4, GSC
- **I** (Informado): nenhum

## Calendario

| Trimestre | Mes | Batch | Acoes |
|-----------|-----|-------|-------|
| Q1 | Janeiro | D01-D05 (Ferramentas) | stats.json refresh, blog refresh (top 3 posts), OG regen |
| Q1 | Fevereiro | A01-A10 (Nicho) | stats.json, 1 post novo por site, review testimonials |
| Q1 | Marco | B/E (Dor/Pre-SaaS) | Waitlist count update, refresh hero copy |
| Q2 | Abril | C/F (Servico/Educativo) | Blog refresh (dateModified), FAQ review |
| Q2 | Maio | D06-D10 (se existir) | Calculadora review, benchmarks |
| Q2 | Junho | A11-A20 | Consolidacao + dedupe cross-sell rules |
| Q3 | Jul-Set | Rotacao completa | Similar ao Q1/Q2, cross-check com GSC Core Update |
| Q4 | Out-Dez | Foco em Black Friday + sazonalidade | Hero swap tematico (Cat A), promo banners |

## Itens por refresh
1. **stats.json** — checar se dados >12 meses, atualizar com fontes recentes
2. **Blog refresh** — top 3 posts por site com `dateModified` + 1 paragrafo novo
3. **OG regeneration** — `npx tsx scripts/generate-og.ts --site <slug>`
4. **Testimonials** — remover depoimentos >18 meses sem consent renovado
5. **Sitemap re-submit** — rodar `scripts/gsc-submit-sitemaps.ts`

## Metrica de sucesso
- GSC Impressoes: +5% mes sobre mes na categoria refreshada
- Bounce rate: reducao >= 2pp em paginas atualizadas

---

## Agendamento efetivo (TASK-11 / CL-260)

### Cron local

`scripts/setup-cron.sh` registra a entrada (primeiro dia util de cada trimestre):

```
0 9 1 1,4,7,10 * scripts/check-content-freshness.sh 2>&1 \
  | tee -a logs/freshness.log \
  > logs/refresh-checklist-YYYY-QN.md
```

Output:
- `logs/freshness.log` — historico acumulado
- `logs/refresh-checklist-YYYY-QN.md` — checklist datado do trimestre (input da revisao humana)

### Alternativa: GitHub Action manual

Se o host local nao estiver ligado, usar `.github/workflows/content-refresh.yml` com `schedule: cron: '0 9 1 1,4,7,10 *'` e `workflow_dispatch` para trigger manual. O job executa `bash scripts/check-content-freshness.sh` e faz upload do MD como artifact para Pedro abrir como issue.

### Fluxo operacional pos-cron

1. **Dia 1 09:00 BRT** — cron gera `refresh-checklist-YYYY-QN.md`
2. **Dia 1 a 3** — Pedro converte em issue `[Content Refresh] YYYY QN` com checklist `[STALE]`/`[WARNING]`
3. **Dia 4 a 10** — atualizacao efetiva + bump `lastReviewed` em `sites/{slug}/config.json`, commit `chore(content): refresh trimestral YYYY QN`
4. **Dia 11** — re-rodar `bash scripts/check-content-freshness.sh` — esperado 0 STALE

### Dry-run

```bash
crontab -l | grep "micro-sites freshness"                            # verificar registro
bash scripts/check-content-freshness.sh | tee logs/refresh-checklist-dry-run.md  # simular
crontab -l | grep -v "micro-sites" | crontab -                       # remover todos jobs
```
