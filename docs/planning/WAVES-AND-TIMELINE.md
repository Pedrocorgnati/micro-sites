# Plano de Ondas e Timeline

## Ondas de deploy

### Onda 1 (12 sites — prioridade absoluta)
D01, D02, C01, C05, F01, B01, A01, A02, A04, C02, B03, D03

### Onda 2 (12 sites — condicional a Onda 1)
A03, A05, A10, C03, C04, B02, B04, B08, A06, A09, C06, D04

### Onda 3 (12 sites — condicional a Onda 2)
A07, A08, C07, C08, B05, B06, B07, D05, E01, E02, E03, F02

## Timeline 12 semanas

| Semana | Atividade |
|--------|-----------|
| S1-S2 | Arquitetura + D01 (pilot) |
| S3-S4 | Onda 1 build (6 sites) |
| S5-S6 | Onda 1 build (6 sites restantes) + deploy completo |
| S7-S8 | Validação Onda 1 (métricas, SEO, leads) |
| S9-S10 | Onda 2 build + deploy |
| S11 | Validação Onda 2 |
| S12 | Onda 3 iniciada (condicional a métricas) |

## Critérios de go/no-go entre ondas

- Onda 2 só inicia se Onda 1 gerou >=10 leads em 4 semanas pós-deploy
- Onda 3 só inicia se custo/lead <R$ 500 e pelo menos 1 projeto fechado
- Se Onda 1 não atingir metas: iterar conteúdo antes de escalar

## Gaps cobertos
- CL-198, CL-199, CL-200, CL-201
