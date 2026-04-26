# Post-Conversion Runbook

## Trigger
Lead chega via SystemForge (formulário) ou WhatsApp de qualquer micro-site.

## Fluxo

### 1. Identificação (T+0)
- Registrar origem: slug do site, `_origin` hidden field, UTM tags
- Classificar: categoria (A/B/C/D/E/F), score (se aplicável), intent

### 2. Primeira resposta (T+24h)
- SLA: máximo 24h corridas
- Canal: mesmo do lead (email→email, WhatsApp→WhatsApp)
- Conteúdo: agradecimento + proposta de próximo passo (call 20min ou envio de material)

### 3. Proposta (T+48h)
- Diagnóstico rápido, proposta comercial ou material de apoio
- Documentar no CRM-leve (ver SLA.md)

### 4. Follow-up (T+7d)
- Se sem resposta: 1 follow-up via canal alternativo
- Se ainda sem resposta: encerrar lead como `cold` após T+14d

## Capacidade operacional
- Alvo: até 30 leads/mês no modelo manual
- Gatilho para migrar para Pipedrive ou similar: 40+ leads/mês em 2 meses seguidos
- Alternativa intermediária: E02 (formulário avançado + auto-resposta segmentada)

## Gaps cobertos
- CL-114, CL-115, CL-116, CL-117, CL-118, CL-119
