# ADR-0006 — Escopo quad-market (pt-BR-first em Onda 1)

**Status:** Accepted
**Data:** 2026-04-21
**Origem:** Intake Review TASK-2 ST001 (gap CL-331)
**Supersedes:** nenhum

---

## Contexto

O pipeline `/blog:*` do SystemForge suporta publicacao quad-market (pt-BR, it-IT, en, es-ES). Na revisao de intake, o gap CL-331 identificou que nao havia decisao formal sobre quais linguas a rede de micro-sites ativaria na Onda 1.

Fatores:
- Publico-alvo primario: PMEs brasileiras
- Custo de producao multilingue: 4x artigos, 4x reviews de qualidade, 4x validacoes SEO
- Risco de content thin em linguas adicionais sem trafego comprovado
- Hreflang/localizacao adiciona complexidade de deploy e sitemap

---

## Decisao

**Onda 1: pt-BR-first.** Todos os 36 sites publicam exclusivamente em pt-BR enquanto validamos:
1. Volume de trafego organico pt-BR via GSC
2. Taxa de conversao lead-magnet -> venda
3. Estabilidade de ranking nas queries seed

Onda 2 reavaliara it-IT, en, es-ES quando (gating):
- Site tenha >= 12 artigos pt-BR publicados e indexados
- RC-BLOG (ranking clicado) >= P50 sobre queries seed
- Revenue atribuida ao site >= meta mensal definida em BUDGET.md

Ate la, comandos `/blog:localize-check` e `/blog:hreflang-map` rodam em **dry-run** — geram relatorios mas nao modificam arquivos.

---

## Consequencias

Positivas:
- Foco em qualidade pt-BR sem diluir esforco
- Decisao de i18n baseada em dados reais, nao em hipotese
- Menor risco de penalidade Google por content thin multilingue

Negativas:
- Mercados it/en/es ficam inativos por ate 6 meses
- Necessidade de revisitar ADR ao atingir gating

Operacionais:
- `next.config.ts` locales: apenas `['pt-BR']` na Onda 1
- `sites/*/config.json`: campo `languages` nao e obrigatorio por enquanto
- CI bloqueia PRs que adicionem artigos em `locales/{it,en,es}/` ate nova ADR

---

## Referencias

- [docs/blog-pipeline-integration.md](../blog-pipeline-integration.md) secao 4
- Intake Review Compare: CL-331
- BUDGET.md (targets de revenue por site)
