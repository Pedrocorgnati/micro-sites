# ADR-0007 — Lighthouse thresholds oficiais

**Status:** Accepted
**Data:** 2026-04-21
**Origem:** Intake Review — gap CL-253

## Contexto

A rede tem 36 sites estaticos em duas familias de performance:
- **Padrao (A/B/C/E/F):** paginas institucionais/educativas sem interatividade pesada.
- **Categoria D:** calculadoras com JS client-side (D01–D05), onde 95 de performance e custoso sem sacrificar UX.

## Decisao

Gate Lighthouse em CI (`scripts/lighthouse-gate.ts`) usa dois presets:

| Categoria | Performance | Accessibility | Best-Practices | SEO  | Extra            |
|-----------|-------------|---------------|----------------|------|------------------|
| A/B/C/E/F | 95          | 95            | 90             | 95   | TBT <= 200ms     |
| D         | 85          | 95            | 90             | 95   | INP <= 200ms     |

Valores refletidos em `lighthouserc.json` (padrao) e `lighthouserc-d.json` (Cat. D), e tambem exportados via constante `LIGHTHOUSE_THRESHOLDS` em `scripts/lighthouse-gate.ts` para consumo cruzado.

## Consequencias

- PRs que regredirem qualquer metrica acima falham no workflow `deploy.yml`.
- Ajustes futuros exigem atualizacao **simultanea** dos 3 pontos (2 rc.json + constante).
- Best-practices ficou em 90 (nao 95) por causa de warnings inevitaveis do Hostinger shared (HTTP/2, headers).

## Alternativas consideradas

- Threshold unico 95 para todos — rejeitado por quebrar Cat. D sem sinal real de UX ruim.
- Threshold warn-only — rejeitado por degradar protecao de regressao.
