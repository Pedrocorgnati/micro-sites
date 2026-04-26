# SEO-PRIORITY — Ordem de priorizacao dos 36 sites

**Origem:** Intake Review — CL-105 (TASK-3)
**Fonte de dados:** [kd-analysis.md](./kd-analysis.md) + [top5-rationale.md](./top5-rationale.md)
**Consumido por:** `scripts/seo-audit-batch.sh`
**Data:** 2026-04-21

---

## Criterios (ver top5-rationale.md)

```
score = (vol / max_vol) * 0.45
      + ((100 - kd) / 100) * 0.35
      + intent_weight * 0.20
```

`intent_weight`: T=1.0, C=0.9, I/C=0.7, I=0.4, N=0.2.

---

## Ordem canonica de priorizacao

### Tier 1 — TOP 5 (auditar primeiro em cada rodada)

| # | Slug                             | Categoria | Intent | Rationale                                |
|---|----------------------------------|-----------|--------|------------------------------------------|
| 1 | c01-site-institucional-pme       | C         | C      | Produto-ancora, margem alta              |
| 2 | d01-calculadora-custo-site       | D         | C      | Lead magnet forte                        |
| 3 | c02-landing-page-conversao       | C         | C      | Demanda B2B                              |
| 4 | f01-blog-desenvolvimento-web     | F         | I/C    | Hub editorial (alimenta interlinking)    |
| 5 | e02-automacao-whatsapp           | E         | C      | Tendencia crescente, CPC bom             |

### Tier 2 — Produto-servico (C/E/D restantes)

6. c05-sistema-agendamento (C)
7. c06-automacao-atendimento (C)
8. c03-app-web-negocio (C)
9. c04-ecommerce-pequeno-negocio (C)
10. c07-sistema-gestao-web (C)
11. c08-manutencao-software (C)
12. d02-calculadora-custo-app (D)
13. d04-calculadora-roi-automacao (D)
14. d03-diagnostico-maturidade-digital (D)
15. d05-checklist-presenca-digital (D)
16. e01-ia-para-pequenos-negocios (E)
17. e03-site-com-ia (E)

### Tier 3 — Dor do gestor (B)

18. b01-sem-site-profissional
19. b06-sem-leads-qualificados
20. b07-site-nao-aparece-google
21. b04-sem-presenca-digital
22. b03-sem-automacao
23. b02-site-antigo-lento
24. b05-perder-clientes-online
25. b08-concorrente-digital

### Tier 4 — Hub editorial restante

26. f02-blog-marketing-digital (F)

### Tier 5 — Nichos verticais (A) + cauda longa

27. a01
28. a02
29. a03
30. a04
31. a05
32. a06
33. a07
34. a08
35. a09
36. a10

---

## Lista "slugs em ordem" (formato consumivel por scripts)

Arquivo auxiliar: [`seo-priority-order.txt`](./seo-priority-order.txt) — uma linha por slug, na ordem canonica desta tabela. E o formato lido por `scripts/seo-audit-batch.sh` quando disponivel; caso ausente, o script cai no ordenamento alfabetico historico.

---

## Revisao

- Trimestral ou quando TOP-5 mudar
- Gatilho de reabertura: queda > 30% em CVR de qualquer TOP5 em 30d
- Qualquer mudanca de ordem deve ser refletida em `seo-priority-order.txt`
