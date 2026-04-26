# Nurture Flow — Perfil Terciário (D03/D04)

Gap: **CL-008** (perfil terciário sem CTA direto; nurture via email + WhatsApp).

## Trigger
Usuário completa ferramenta D03 (self-assessment) ou D04 (checklist/score baixo).

## Etapas

### 1. Captura (D+0)
- `/resultado` mostra score parcial + campo email opcional
- Submissão via Static Forms → webhook registra lead com `origin=d03|d04`

### 2. Follow-up email (D+2)
- Disparo **manual** ou via Static Forms webhook (configurar em MailerLite futuro)
- Template: resumo do resultado + link para conteúdo complementar + convite para diagnóstico gratuito

### 3. Follow-up WhatsApp (D+5)
- SystemForge envia mensagem via `buildNurtureMessage(slug, score)` (copy-paste manual)
- CTA: proposta C05 (institucional pré-venda) ou C06 (diagnóstico pago simbólico)

## Templates por categoria D

| Site | Mensagem WhatsApp (D+5) |
|------|-------------------------|
| D01 (calculadora impostos) | "Oi! Vi que você fez a simulação. Posso te mostrar como reduzir em média 15% com um diagnóstico rápido?" |
| D02 (simulador ROI) | "Notei que seu ROI ficou abaixo do benchmark. Que tal agendarmos 20min?" |
| D03 (self-assessment) | "Seu resultado indicou oportunidades em X. Tenho 3 cases parecidos — posso compartilhar?" |
| D04 (checklist) | "Faltaram poucos itens para 100%. Posso te ajudar a fechar os gaps principais em uma call de 30min?" |
| D05 (comparador) | "Vi sua comparação. Posso enviar nosso detalhamento técnico de cada item?" |

## Gaps cobertos
- CL-008
- CL-013 (TASK-7 — runbook + automacao minima)

---

## Runbook operacional (TASK-7 / CL-013)

### SLA

| Etapa                                     | SLA             | Owner        |
|-------------------------------------------|------------------|--------------|
| Notificacao automatica (email alerta Pedro) | < 15min         | Pipeline    |
| Resposta humana (WhatsApp/email)          | 24h uteis       | Pedro        |
| Follow-up 2 (se sem resposta)             | D+5             | Pedro        |
| Escalonamento (sem conversao em 14d)      | marcar como "frio"| Pedro       |

### Payload obrigatorio no Static Forms

Todo submit de formulario D03/D04 deve conter:

```json
{
  "source": "d03-diagnostico-maturidade-digital",
  "calculator_type": "d03",
  "nurture_priority_tag": "D03",
  "email": "...",
  "score_partial": 42
}
```

O campo `source` e resolvido no componente a partir de `SITE_SLUG`.
O helper `trackLeadMagnetDownloaded()` em `src/lib/analytics.ts` garante
que o evento GA4 `lead_magnet_downloaded` carrega `calculator_type` e
`nurture_priority_tag` como dimensoes customizadas.

### Notificacao automatica (< 15min)

- **Opcao A — recomendada**: webhook do Static Forms → Zapier/Make → email.
  Template do email: `[Nurture {TAG}] Lead novo: {source} — score {score_partial}%`.
- **Opcao B — fallback**: poll no `check-static-forms-quota.ts` com hook
  que emite linha `[nurture] LEAD:` em stdout; o cron roda a cada 15min.

### Copy de follow-up (D+2 email)

```
Assunto: Seu resultado no {nome_ferramenta} + 3 proximos passos

Oi {nome},

Voce acabou de completar o {nome_ferramenta} e o resultado apontou
{score}%. Isso significa que {interpretacao}.

3 coisas que voce pode fazer agora:
1. {acao_curta_1}
2. {acao_curta_2}
3. {acao_curta_3}

Se quiser acelerar, posso te mostrar como 2-3 empresas parecidas
resolveram esse problema em uma call de 20min — sem custo e sem venda.

Responder este email ja me marca na agenda.

Abs,
Pedro
```

### Template WhatsApp (D+5)

Ver tabela acima por slug. Envio manual ate automatizacao via Z-API.

### Caminho de escalonamento

- **D+0 a D+14**: Pedro responde pessoalmente (email + WhatsApp).
- **D+14 sem conversao**: mover lead para "frio" no CRM (tag `cold_d03` ou `cold_d04`) e parar follow-up manual; reativar apenas em campanhas sazonais.
- **Conversao em C05/C06**: tagear como `won_{origem}` e arquivar jornada.
