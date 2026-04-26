# Pitch — Cat C (Servicos Tech B2B)

**Audiencia:** PME B2B que veio de C01-C08 (institucional, landing, ERP web)
**Duracao:** 5-15min — conversa consultiva

## Abertura (30s)

> Oi {nome}! Recebi seu pedido sobre {tipo: site institucional /
> landing / app web}. Antes de orcar, posso te perguntar 3 coisas
> rapidas para garantir que a proposta resolve o que voce precisa?

## Discovery (3-5min)

1. **Negocio:** o que sua empresa vende e para quem? (PME B2B vs B2C, ticket medio)
2. **Hoje:** ja tem site? Como entram os leads/clientes hoje?
3. **Objetivo:** o que precisa estar funcionando em 90d?

## Proposta de valor (Cat C foco)

Eixo principal: **resultado de negocio**, nao "feature".

- "Em vez de 'site rapido' falo 'site que carrega <2s no celular = +12% conversao no funil de orcamento'."
- "Em vez de 'design moderno' falo 'design que constroi confianca no setor X (ja fizemos com 5 PME do segmento)'."
- "Em vez de 'integracao WA' falo 'lead chega no WA com nome + dor + origem em 30s — nao perde mais ninguem'."

## Diferenciais SystemForge

1. **LGPD-ready** — ROPA, base legal, ConsentCheckbox em todos os forms (pasta `docs/compliance/`)
2. **Compliance audit** — Sentry integrado, sf-purge 24m, alert rules
3. **Performance gate** — Lighthouse >= 95 obrigatorio antes de production
4. **Stack moderna** — Next.js 16, deploy estatico Hostinger (custo baixo, escala alta)
5. **Documentation-first** — cliente recebe PRD + LLD + ADRs + handoff

## Casos similares

- C01 (institucional PME): cliente {anonimo} 4 semanas, R$ {X}, hoje recebe N leads/m
- C04 (e-commerce): cliente {anonimo} 8 semanas, R$ {Y}, GMV M+1 R$ {Z}

> **Nota Pedro:** anexar screenshot Lighthouse + leads dashboard antes de mandar.

## CTA escalonado

1. **Reuniao 30min** (qualifica e fecha): "Tenho horario quarta 14h. Te mando link."
2. **Proposta PDF**: "Mando ate amanha 18h, baseado no que conversamos."
3. **Briefing escrito**: "Manda em ate {Y} se preferir formalizar."

## Objecoes mais comuns

| Objecao | Resposta |
|---------|----------|
| "Ja tenho um designer/dev" | "Otimo. Posso entrar como performance + LGPD audit. Faco PR review." |
| "Caro vs Wix/agencia" | "Wix custa baixo + manutencao alta. Calculo TCO 3 anos: ~empate. Diferenca esta em LGPD + custom." |
| "E manutencao?" | "Pacote opcional R$ {X}/m. Inclui patch, update Next, audit Lighthouse mensal." |
| "Prazo apertado?" | "Faco escopo enxuto MVP em 2 semanas + iteracoes pos-launch." |

## Metricas

- Time-to-discovery-call: <48h
- Conversion lead C -> reuniao: alvo 50%
- Conversion proposta C -> fechamento: alvo 35%
- Ticket medio: R$ 8k-25k
