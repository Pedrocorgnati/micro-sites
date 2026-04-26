# Rationale — TOP5 sites prioritarios

**Origem:** Intake Review — CL-109
**Decisao registrada em:** 2026-04-21
**Owner:** SEO (aprovacao final com Produto)

## Criterios de elegibilidade

Um site entra no TOP5 se cumpre **todos**:

1. `KD <= 30` (baixa dificuldade SEO, ranqueavel em 90d).
2. `Volume mensal >= 500` (suficiente para MVP de conversao).
3. Intencao **comercial** ou **informacional-comercial** (evitar puramente informacional sem CTA).
4. Alinhamento com proposta de valor do portfolio SystemForge.
5. Onda atual ativa (respeita sequenciamento do rollout).

## Score composto

```
score = (vol / max_vol) * 0.45
      + ((100 - kd) / 100) * 0.35
      + intent_weight * 0.20
```

Onde `intent_weight`: T=1.0, C=0.9, I/C=0.7, I=0.4, N=0.2.

## TOP5 (preliminar — valida apos preenchimento de kd-analysis.md)

| # | Site slug                          | KW                             | KD  | Vol  | Intent | Score | Nota                                          |
|---|------------------------------------|--------------------------------|-----|------|--------|-------|-----------------------------------------------|
| 1 | c01-site-institucional-pme         | site institucional pme         | TBD | TBD  | C      | TBD   | Produto-ancora do portfolio, margem alta.     |
| 2 | d01-calculadora-custo-site         | calculadora custo site         | TBD | TBD  | C      | TBD   | Ferramenta-lead-magnet forte.                 |
| 3 | c02-landing-page-conversao         | landing page conversao         | TBD | TBD  | C      | TBD   | Alinha com demanda B2B.                       |
| 4 | f01-blog-desenvolvimento-web       | blog desenvolvimento web       | TBD | TBD  | I/C    | TBD   | Hub editorial que alimenta interlinking.      |
| 5 | e02-automacao-whatsapp             | automacao whatsapp empresa     | TBD | TBD  | C      | TBD   | Tendencia crescente, bom CPC de referencia.   |

> **Status:** shortlist **preliminar** baseada em hipotese de portfolio. Validacao final bloqueada pela coleta de `KD/Vol` em `kd-analysis.md`. Ao preencher, recalcular `score` e reordenar.

## Itens que ficaram de fora (e por que)

- **b0x (sites de dor):** intencao I forte, CVR tipicamente menor — priorizar na onda 2.
- **a0x (nichos verticais):** volume < 500 em varias KWs — candidatos a cauda-longa.
- **d03-diagnostico-maturidade-digital:** intencao mais informacional, melhor como suporte.

## Revisao

- Trimestral (owner SEO).
- Gatilho de reabertura: queda > 30% em CVR de qualquer TOP5 em 30d.
