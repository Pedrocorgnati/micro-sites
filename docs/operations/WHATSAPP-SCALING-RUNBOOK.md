# WhatsApp — Scaling Runbook (CL-597)

**Origem:** TASK-9 / intake-review
**SLA atual:** Pedro responde em <2h dia util / <24h fim de semana

## Gatilhos para escalar

| Sinal | Acao |
|-------|------|
| >5 leads/dia consistente por 2 semanas | Avaliar Solucao 1 (Catalog) |
| >10 leads/dia OU SLA >2h em 30% dos casos | Solucao 2 (terceirizar N1) |
| Mensagens fora do horario perdidas (>10%/mes) | Auto-resposta + horario explicito |

## Solucoes

### Solucao 1 — WhatsApp Business Catalog + respostas rapidas (low cost)
- **Quando:** 5-10 leads/dia, Pedro ainda da conta mas desorganiza
- **Custo:** R$ 0 (WA Business app) + 1-2h setup
- **Como:**
  1. Configurar mensagem ausencia / saudacao
  2. 5 respostas rapidas: "Quanto custa", "Prazo", "Como funciona", "Agendar reuniao", "Caso de sucesso"
  3. Etiquetas: Lead-Quente, Lead-Frio, Aguardando-Pedro, Convertido
  4. Catalog com servicos principais (D/A/C)

### Solucao 2 — Terceirizar atendimento N1 (medio prazo)
- **Quando:** >10 leads/dia, Pedro vira gargalo
- **Custo:** R$ 1500-3000/mes (assistente PJ part-time)
- **Como:**
  1. Treinar assistente em 5 perguntas frequentes (FAQ)
  2. Pedro escala N2 quando lead pede orcamento ou quer marcar reuniao
  3. SLA renovado: N1 <30min, N2 <24h
  4. Risco LGPD: assistente assina termo de confidencialidade

### Solucao 3 — Bot WA Web (DESCARTADO)
- **Por que:** WhatsApp Business API ($) + risco LGPD (auto-resposta com PII), inferior a Solucao 1
- **Quando reconsiderar:** se WA mudar politica de bots OU virarmos B2B com volume >50/d

## Procedimento de escalacao Pedro -> assistente

```
1. Pedro contrata 1 assistente PJ (homologar contrato c/ NDA + LGPD treinamento)
2. Compartilha celular WA (mesma conta) ou habilita WhatsApp Business Multi-device
3. Etiquetas:
   - "Pedro" -> Pedro responde
   - "N1" -> assistente responde com FAQ
   - "Urgente" -> Pedro responde imediato
4. Daily standup 8h45 (5min) — alinhar leads quentes do dia anterior
```

## Compliance LGPD

- WA Business Multi-device: cada assistente tem acesso ao mesmo backlog. Treinar em politica de minimo necessario.
- Mensagens excluidas apos 24m (alinhado a `sf-purge-24m`).
- Solicitar consent explicit ao primeiro contato: "OK se eu responder por aqui? Para sair, basta enviar SAIR."

## Referencias

- `docs/operations/SLA.md` — SLA atualizado
- `docs/business/PERSONAS.md` — categorias de lead
- LGPD-SLA.md (TASK-4)

## PENDING-ACTIONS

- `wa-scaling-evaluate-2026-Q3`: revisar gatilhos
- `wa-business-multi-device-setup`: ativar quando contratar primeiro assistente
