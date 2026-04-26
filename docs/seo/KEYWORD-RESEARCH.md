# KEYWORD-RESEARCH — Rede Micro Sites

**Origem:** Intake Review — CL-103, CL-104 (TASK-3)
**Fonte canonica (brief):** [TECH-FEASIBILITY.md](../../../../../brief/micro-sites/TECH-FEASIBILITY.md)
**Dataset detalhado (KD/Vol por slug):** [kd-analysis.md](./kd-analysis.md)
**Data:** 2026-04-21
**Owner:** SEO (coleta + atualizacao trimestral)

---

## Proposito

Ponte entre o brief (TECH-FEASIBILITY.md) e o workspace. Este documento consolida
a keyword-alvo principal de cada um dos 36 sites, com KD/volume/CPC/intent, e
aponta para as fontes primarias. A tabela granular (36 linhas) vive em
`kd-analysis.md` (formato operacional do owner SEO). Este arquivo e o sumario
de referencia citado por:

- `scripts/seo-audit-batch.sh` (ordem de auditoria — ver SEO-PRIORITY.md)
- `/blog:*` pipeline (keywords-alvo para geracao de brief editorial)
- TECH-FEASIBILITY.md (validacao de hipotese de viabilidade tecnica por nicho)

---

## Sumario por categoria

| Cat | Sites | KW-alvo (exemplos) | Observacoes |
|-----|-------|---------------------|-------------|
| A   | 10 (a01..a10) | nichos verticais com cauda longa | Volume < 500 em varios; prioridade baixa, entra onda 2/3 |
| B   | 8 (b01..b08) | dor do gestor (sem site, sem leads, lento) | Intent I → I/C; CVR menor, melhor como lead magnet |
| C   | 8 (c01..c08) | produto-ancora (site institucional, landing, sistema) | Intent C; margem alta. c01/c02 sao TOP5. |
| D   | 5 (d01..d05) | ferramentas (calculadora, diagnostico, checklist) | Intent C/lead magnet. D01 no TOP5. |
| E   | 3 (e01..e03) | IA/automacao (WhatsApp, site com IA, PME) | Intent C; tendencia crescente. e02 no TOP5. |
| F   | 2 (f01..f02) | hub editorial (blog desenv web, blog mkt digital) | Intent I/C; alimenta interlinking. f01 no TOP5. |

Total: **36 sites**.

---

## Top-5 sites prioritarios (resumo)

| # | Slug                           | KW                             | Intent | Rationale curto                                |
|---|--------------------------------|--------------------------------|--------|-----------------------------------------------|
| 1 | c01-site-institucional-pme     | site institucional pme         | C      | Produto-ancora, margem alta                    |
| 2 | d01-calculadora-custo-site     | calculadora custo site         | C      | Lead magnet forte                              |
| 3 | c02-landing-page-conversao     | landing page conversao         | C      | Demanda B2B                                    |
| 4 | f01-blog-desenvolvimento-web   | blog desenvolvimento web       | I/C    | Hub editorial                                  |
| 5 | e02-automacao-whatsapp         | automacao whatsapp empresa     | C      | Tendencia crescente                            |

Detalhe e score composto em [SEO-PRIORITY.md](./SEO-PRIORITY.md) + [top5-rationale.md](./top5-rationale.md).

---

## Tabela completa (36 slugs)

Fonte de verdade: [`kd-analysis.md`](./kd-analysis.md).

Campos coletados por slug:

- `slug` — identificador do site
- `KW` — keyword-alvo principal
- `Vol` — volume mensal de busca (pt-BR)
- `KD` — Keyword Difficulty (0-100)
- `CPC` — Cost-per-click (R$)
- `SERP` — features (FS/PAA/LP/VID/IMG)
- `Intent` — I / C / T / N

---

## Fluxo de atualizacao

1. Owner SEO coleta KD/Vol via Ubersuggest + cross-check DR via Ahrefs free tier
2. Atualiza `kd-analysis.md` (linha-a-linha) e recalcula scores em `SEO-PRIORITY.md`
3. Se o TOP-5 mudar, notifica Produto e atualiza `top5-rationale.md`
4. `scripts/seo-audit-batch.sh` le `SEO-PRIORITY.md` para ordenar auditoria

Cadencia: **trimestral** ou apos refresh material (queda > 30% em CVR de um TOP5).

---

## Ligacao com o brief

O brief `TECH-FEASIBILITY.md` ja declara a hipotese: **36 sites, 28 com blog, 5 calculadoras, complexidade tecnica baixa exceto D01-D05**. A priorizacao SEO neste workspace refina *em qual ordem* construir/auditar, respeitando a arquitetura do brief.
