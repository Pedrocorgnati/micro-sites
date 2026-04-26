# Metas e Plano de Tracking

## Metas (6 meses)

| Indicador | Meta |
|-----------|------|
| Sites ranqueando 1ª página | 30% (50% se domínio próprio) |
| Leads qualificados/mês | 20+ |
| Projetos fechados/mês | 2-3 |
| Custo por lead | <R$ 500 |
| Ticket médio | R$ 5.000+ |

## Métricas monitoradas

### Quantitativas (automáticas)
| Métrica | Fonte | Frequência | Responsável |
|---------|-------|-----------|-------------|
| Impressões/cliques | GSC | Mensal (cron) | Pedro |
| Usuários/sessões | GA4 | Mensal (cron) | Pedro |
| Leads | Static Forms + CSV | Mensal | Pedro |
| Lighthouse scores | CI | Mensal + por PR | Dev |

### Qualitativas (amostragem manual)
| Métrica | Método | Frequência |
|---------|--------|-----------|
| Presença em AI Overviews | GSC (impressões orgânicas atípicas) | Mensal |
| Citações em ChatGPT / Perplexity | Sampling manual de 5-10 queries seed | Mensal |
| Qualidade de tráfego | Análise de eventos GA4 (scroll, time) | Trimestral |

## Dashboard
- HTML estático gerado em `scripts/metrics/aggregate.ts` → `dashboard.html`
- Atualizado mensalmente via cron
- Revisão no primeiro dia útil do mês

## Gaps cobertos
- CL-214, CL-217, CL-218, CL-220, CL-221
