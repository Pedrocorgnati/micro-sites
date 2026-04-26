# Hypotheses Review Log (CL-609)

**Origem:** TASK-11 / intake-review
**Cadencia:** trimestral (alinhar com `QUARTERLY-ROPA-REVIEW`)
**Owner:** Pedro Corgnati

> Log de revisao das hipoteses de negocio do INTAKE §13 ("Hipoteses
> e premissas a validar"). Cada entrada registra estado atual,
> evidencia coletada e decisao (manter / refutar / pivotar).

## Status legend

- **VALIDADA** — evidencia confirma hipotese, manter como premissa
- **REFUTADA** — evidencia nega, pivotar
- **PARCIAL** — evidencia mista, refinar enunciado e re-validar
- **PENDENTE** — sem dados suficientes ainda

---

## Hipoteses ativas

### H1 — Cat D (calculadoras) e principal driver de conversao

**Enunciado:** Calculadoras (D01-D05) capturam mais leads qualificados
por sessao do que landing pages institucionais (Cat C).

**Status:** PENDENTE
**Evidencia esperada:** GA4 funnel `calculator_completed` vs `contact_form_submit`
**Decisao prazo:** 2026-Q3 (apos 60 dias de trafego organico)
**Acao se REFUTADA:** desviar verba SEO de Cat D para Cat C, reavaliar lead-magnet

---

### H2 — Persona dor-especifica (Cat B) converte melhor que persona generica (Cat C)

**Enunciado:** Sites Cat B com headlines de objecao explicita
("sem site profissional", "site lento") tem CTR maior que sites Cat C
genericos ("agencia digital").

**Status:** PENDENTE
**Evidencia esperada:** GSC CTR comparado entre B vs C wave 1
**Decisao prazo:** 2026-Q3
**Acao se REFUTADA:** consolidar Cat B em hub-and-spoke sob C01

---

### H3 — Cat F (blogs) gera autoridade SEO compensatoria

**Enunciado:** Blogs F01/F02 trazem ranking organico que canaliza
trafego para Cat C/D atraves de internal linking, justificando
investimento em conteudo mensal.

**Status:** PENDENTE
**Evidencia esperada:** GA4 referrer (path /blog/* -> /servicos/*) +
GSC posicao media F vs C
**Decisao prazo:** 2026-Q4 (12 meses pos-launch dos blogs)
**Acao se REFUTADA:** parar producao de blog mensal, manter so
artigos pillar evergreen

---

### H4 — WaitlistForm (Cat E) valida demanda pre-SaaS

**Enunciado:** Cat E (E01-E03) com waitlist >50 inscritos em 90d
indica demanda real para construir o SaaS correspondente.

**Status:** PENDENTE
**Evidencia esperada:** SF inbox `waitlist_signup` por slug
**Decisao prazo:** 2026-Q3
**Threshold:** se Cat E1 atingir 50/90d, priorizar build do MVP

---

### H5 — LGPD-compliance e diferencial de venda B2B

**Enunciado:** Clientes Cat C (PME B2B) preferem fornecedores que
exibem LGPD-readiness (ROPA, PrivacyPolicy, Sentry compliance) sobre
concorrentes equivalentes em preco.

**Status:** PARCIAL
**Evidencia coletada (2026-04):**
- 2 dos 3 leads C01 mencionaram "voces tem LGPD?" no primeiro contato
- 0 mencionaram em A* ou D* — clientes B2C nao perguntam
**Decisao:** manter como diferencial em sales pitch C, NAO mencionar em A
**Re-validar em:** 2026-Q4

---

### H6 — Quad-market (pt/it/en/es) expande TAM sem custo proporcional

**Enunciado:** Os blogs F01/F02 multilingue (pt-BR/it-IT/en/es-ES)
geram leads internacionais que justificam o esforco de localizacao.

**Status:** PENDENTE
**Evidencia esperada:** GA4 segment `country !== BR` -> conversao
**Decisao prazo:** 2026-Q4
**Acao se REFUTADA:** reduzir blog para pt-BR + it-IT (mercados validados)

---

## Procedimento de revisao trimestral

1. Para cada H#, coletar evidencias (GA4, GSC, SF inbox, leads dashboard)
2. Atualizar campo `Status` + `Evidencia coletada` + `Decisao`
3. Se REFUTADA: criar issue de pivotacao + atualizar `MONETIZATION.md`
4. Se VALIDADA: arquivar entrada em `HYPOTHESES-VALIDATED.md`
5. Adicionar novas hipoteses surgidas no trimestre

## Versao

- v1.0 (2026-04-25) — TASK-11 / intake-review — log inicial com 6 hipoteses
