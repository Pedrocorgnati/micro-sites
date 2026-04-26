# Blog Pipeline Integration — SystemForge `/blog:*` → micro-sites

**Projeto:** Micro Sites
**Origem:** Intake Review TASK-2 ST001 (gaps CL-329, CL-330, CL-331)
**Versao:** v1.0
**Data:** 2026-04-21
**Complementa:** [docs/BLOG-PIPELINE.md](./BLOG-PIPELINE.md) (pipeline interno)

---

## 1. Objetivo

Formalizar como o pipeline SystemForge `/blog:*` (INIT/DAILY/MENSAL) alimenta os 36 micro-sites, listando:
- Comando por cadencia
- Artefatos produzidos
- Diretorios de destino
- Orquestracao via `scripts/blog-pipeline-wrapper.sh`
- Cadencia por categoria
- Escopo de linguas (ADR-0006)

---

## 2. Mapping Comando -> Artefato -> Destino

| Comando SystemForge | Periodicidade | Papel | Artefato gerado | Destino |
|---------------------|---------------|-------|-----------------|---------|
| `/blog:init-strategy` | One-shot (onboarding) | Define pillars/clusters | `docs/blog/strategy-{slug}.md` | `docs/blog/` |
| `/blog:expand-keywords` | Mensal | Expande keywords seed -> long-tail | `docs/blog/keywords-{slug}.json` | `docs/blog/` |
| `/blog:cluster-keywords` | Mensal | Agrupa por intent/cluster | `docs/blog/clusters-{slug}.json` | `docs/blog/` |
| `/blog:discover-intents` | Mensal | Mapeia intent gaps | `docs/blog/intents-{slug}.md` | `docs/blog/` |
| `/blog:prioritize-topics` | Mensal | Seleciona Top-N do proximo ciclo | `docs/blog/topics-queue-{slug}.md` | `docs/blog/` |
| `/blog:generate-briefs` | Mensal | Brief por artigo | `docs/blog/briefs/{slug}/{topic}.md` | `docs/blog/briefs/` |
| `/blog:write-articles` | Mensal | Redige artigos | `.md` em `sites/{slug}/blog/articles/` | `sites/{slug}/blog/articles/` |
| `/blog:eeat-inject` | Por artigo | Injeta EEAT blocks (autor, revisao, fonte) | Modifica frontmatter do artigo | `sites/{slug}/blog/articles/` |
| `/blog:quality-gate` | Por artigo | Valida antes de publicar | Log `.quality-gate/{slug}-{date}.json` | `.quality-gate/` |
| `/blog:review-seo` | Por artigo | Review SEO on-page | Log em `docs/blog/seo-review/` | `docs/blog/seo-review/` |
| `/blog:build-internal-links` | Mensal | Insere cross-links entre artigos | Modifica artigos + `INTERLINKING-MAP.md` | `sites/{slug}/blog/articles/` |
| `/blog:build-metadata` | Por artigo | Gera OG/meta description/keywords | Frontmatter atualizado | `sites/{slug}/blog/articles/` |
| `/blog:schedule-batch` | Mensal | Define ordem de publicacao | `docs/blog/schedule-{slug}-{YYYY-MM}.md` | `docs/blog/` |
| `/blog:refresh-content` | Trimestral | Atualiza artigos stale | Modifica artigos existentes + log | `sites/{slug}/blog/articles/` |
| `/blog:analytics-review` | Mensal | Le GSC/GA4 e aponta decaying posts | `docs/blog/analytics-{slug}-{YYYY-MM}.md` | `docs/blog/` |
| `/blog:deploy` | Por site | Executa build + deploy (delega ao CI) | Trigger GitHub Actions | `.github/workflows/deploy.yml` |
| `/blog:deduplicate-topics` | Trimestral | Deduplica topicos entre sites | Log de merges | `docs/blog/dedup-log.md` |
| `/blog:competitor-spy` | Mensal | Mapeia gaps vs competidores | `docs/blog/competitors-{slug}.md` | `docs/blog/` |
| `/blog:build-programmatic-pages` | Feature-flag | Gera paginas programaticas | `sites/{slug}/content/programmatic/` | `sites/{slug}/content/` |
| `/blog:localize-check` | Por ciclo | Valida hreflang/localizacao | Log em `docs/blog/localize-{slug}.md` | `docs/blog/` |
| `/blog:hreflang-map` | One-shot / revisao | Constroi mapa hreflang | `docs/blog/hreflang.json` | `docs/blog/` |

---

## 3. Cadencia por categoria (pt-BR, Onda 1)

| Categoria | Tipo de site | `hasBlog` default | Cadencia `/blog:write-articles` | Min posts/ciclo | Observacao |
|-----------|--------------|-------------------|---------------------------------|-----------------|------------|
| A (nicho) | Vertical especifico | true | Mensal (1x) | 1 | Foco LocalBusiness + FAQPage |
| B (dor) | Dor/agitacao | false (padrao) | On-demand | 0 | Apenas se blog habilitado no config |
| C (servico) | Institucional/LP | true (seletivo) | Mensal (1x) | 1 | Somente slugs com `hasBlog: true` |
| D (ferramentas) | Calculadora/diagnostico | true | Bimestral (6 posts/ano) | 1 a cada 2 meses | Blog contextual ao tema da ferramenta |
| E (pre-SaaS) | Waitlist | false | — | 0 | Priorizar lead-magnet + updates na waitlist |
| F (blog puro) | Blog de marca | true | Quinzenal (2x/mes) | 2 | Pilar da rede |

Numeros alvo por mes (Onda 1 ativa):
- A: 10 sites x 1 = 10 posts
- C: ~5 sites com `hasBlog: true` x 1 = 5 posts
- D: 5 sites, cadencia bimestral -> ~2-3 posts/mes
- F: 2 sites x 2 = 4 posts
- **Total esperado:** ~21 a 22 posts/mes

---

## 4. ADR quad-market (CL-331) — resumo

Decisao: **pt-BR-first** em Onda 1. Onda 2 reavaliara it-IT/en/es-ES conforme trafego organico pt-BR e conversao.

Gating de Onda 2:
- `sites/{slug}/blog/articles/` > 12 artigos pt-BR estaveis
- RC-BLOG >= P50 sobre GSC queries pt-BR
- Decisao explicita em ADR-0006 (a criar quando gating satisfeito)

Ate la, comandos `/blog:localize-check` e `/blog:hreflang-map` rodam em **dry-run**.

---

## 5. Orquestracao (scripts/blog-pipeline-wrapper.sh)

O wrapper invoca o **Claude Code CLI** no runner do GitHub Actions para rodar `/blog:*` com o workspace correto. Exemplo:

```bash
# Invocacao diaria (por site) via CI
./scripts/blog-pipeline-wrapper.sh --mode=daily --site=a01

# Invocacao mensal (todos os sites com blog)
./scripts/blog-pipeline-wrapper.sh --mode=monthly
```

Pre-requisitos no runner:
1. `claude` CLI instalado (`npm i -g @anthropic-ai/claude-code` ou similar)
2. Secret `ANTHROPIC_API_KEY` (ou `CLAUDE_AUTH_TOKEN`) exposto ao job
3. `.claude/projects/micro-sites.json` presente (checked-in)

Logs vao para `logs/blog-pipeline/{YYYY-MM-DD}.log`.

---

## 6. Reconciliacao (scripts/blog-inventory-reconcile.ts)

Executa periodicamente:
- Le `sites/*/config.json` para coletar sites com `hasBlog: true`
- Conta `.md` em `sites/{slug}/blog/articles/`
- Compara com tabela de cadencia (secao 3)
- Exit 1 se deficit > 30 dias

Invocacao: `npm run blog:reconcile` (definir em package.json).

---

## 7. CI/CD hooks

- `/blog:quality-gate` roda como step obrigatorio em PRs que modificam `sites/*/blog/`
- `/blog:build-metadata` roda em `pre-commit`
- `.github/workflows/blog-monthly.yml` invoca o wrapper em cron mensal + reconcile

---

## 8. Gaps cobertos (Intake Review Compare)

| ID | Item | Status Apos TASK-2 |
|----|------|-------------------|
| CL-329 | Cadencia de posts por categoria | COMPLETO (secao 3) |
| CL-330 | Pipeline `/blog:*` integrado | COMPLETO (secoes 2, 5, 7) |
| CL-331 | Quad-market pt/it/en/es | COMPLETO (secao 4 + ADR-0006 pendente) |

---

## 9. Referencias

- Pipeline interno existente: [BLOG-PIPELINE.md](./BLOG-PIPELINE.md)
- Schema article frontmatter: `src/schemas/blog.ts`
- Scripts historicos: `scripts/blog-monthly-cron.sh`, `scripts/generate-blog-index.ts`
- Workflow CI: `.github/workflows/blog-monthly.yml`
