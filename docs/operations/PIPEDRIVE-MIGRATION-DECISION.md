# Pipedrive Migration — Decision Doc (CL-292)

**Origem:** TASK-9 / intake-review
**Status:** Decisao recomendada — adiar para 2027 (planilha automatica suficiente)

## Problema

INTAKE §X menciona "considerar Pipedrive quando >30 leads/m". Sem
criterio formal, risco de migracao prematura ou tardia. Este doc define
gatilho, alternativas e custo.

## Criterio gatilho

Migrar para CRM dedicado (Pipedrive ou similar) **quando AMBAS**:

1. **Volume:** >=30 leads qualificados/mes por **2 meses consecutivos**
2. **Operacao:** Pedro identifica gargalo de follow-up >48h em pelo menos 20% dos leads

So volume nao e suficiente — se Pedro consegue dar conta com
WhatsApp + planilha, nao e o momento.

## Alternativas

### Opcao A — Planilha automatica (atual, ate 30 leads/m)
- **Pro:** custo zero, controle total
- **Contra:** sem pipeline visual, follow-up manual
- **Ferramentas:** Google Sheets + Static Forms Zapier (5 ZAPS gratuitos)

### Opcao B — Pipedrive Lite (medio prazo, 30-100/m)
- **Pro:** pipeline visual, automacoes, integracao WhatsApp
- **Contra:** R$ 70-130/mes, curva de aprendizado
- **Migracao:** ~6h (importar planilha + configurar stages + automations)

### Opcao C — HubSpot Free (alternativa B)
- **Pro:** plano free generoso (1M contatos)
- **Contra:** UI mais pesada, recursos premium ageriam upsell agressivo
- **Migracao:** ~8h

### Opcao D — CRM customizado (>200/m, futuro distante)
- **Pro:** total controle, integracao com micro-sites database
- **Contra:** dev cost ~80h, manutencao continua
- **Veredito:** so se virar produto SaaS

## Decisao

1. **Agora (2026-04):** Opcao A — Planilha + Zapier
2. **Trigger 1 (Pipedrive Lite):** 30 leads/m por 2 meses consecutivos
3. **Trigger 2 (CRM customizado):** 200 leads/m + decisao de pivotar para SaaS

## Implementacao Opcao A (atual)

- [ ] Criar planilha `Leads — Micro Sites` (Google Sheets)
- [ ] Colunas: Data, Site, Email, Nome, Telefone, Categoria (D/A/C/F), Origem (calc/contato/waitlist), Status, Follow-up
- [ ] Zap: Static Forms inbox -> Append row
- [ ] Lembrete email Pedro toda segunda 9h: leads sem follow-up >5d

## Reavaliar

- Cadencia: trimestral (alinhar com QUARTERLY-ROPA-REVIEW)
- Sinal de alerta: Pedro registra "leads perdidos" em coluna especifica

## PENDING-ACTIONS

- `pipedrive-evaluation-2026-Q3`: revisar gatilho em julho/2026
