# Static Forms — Setup por Micro-Site

## O que é o Static Forms?

[Static Forms](https://staticforms.xyz) é um serviço de backend-as-a-service para formulários em sites estáticos. Cada micro-site possui uma `formAccessKey` única que direciona os envios para o email configurado na conta — sem backend próprio, sem servidor.

**Por que segmentar por site?** Para rastrear conversões por nicho, receber notificações por email separadas por categoria de site e facilitar o diagnóstico de falhas em formulários individuais.

---

## Passo a passo para configurar

### 1. Criar conta no Static Forms

1. Acesse [https://staticforms.xyz](https://staticforms.xyz)
2. Clique em **Sign Up** e crie uma conta gratuita
3. Confirme o email

### 2. Criar um formulário para cada site

Para cada micro-site:

1. No dashboard, clique em **New Form**
2. Preencha:
   - **Name**: `[slug do site]` (ex: `a01` ou `b01-sem-site-profissional`)
   - **Email**: email de destino (ex: `contato@systemforge.com.br`)
   - **Redirect URL**: `https://[dominio-do-site]/obrigado`
3. Copie a **Access Key** gerada

### 3. Configurar no config.json do site

Abra `sites/{slug}/config.json` e substitua o placeholder:

```json
{
  "formAccessKey": "SUBSTITUIR_PELA_CHAVE_DO_STATIC_FORMS"
}
```

Por:

```json
{
  "formAccessKey": "sua-chave-aqui-1a2b3c4d"
}
```

### 4. Verificar o envio

1. Execute `bash scripts/build-site.sh {slug}`
2. Acesse `/contato` no site em staging
3. Preencha e envie o formulário
4. Verifique se o email chegou na caixa de entrada configurada

---

## Status atual dos sites

> Atualizado em: 2026-04-12. Rodar `bash scripts/check-forms.sh` para re-gerar.

| Site | Status |
|------|--------|
| a01 | ⚠️ Pendente |
| a02 | ⚠️ Pendente |
| a03 | ⚠️ Pendente |
| a04 | ⚠️ Pendente |
| a05 | ⚠️ Pendente |
| a06 | ⚠️ Pendente |
| a07 | ⚠️ Pendente |
| a08 | ⚠️ Pendente |
| a09 | ⚠️ Pendente |
| a10 | ⚠️ Pendente |
| b01-sem-site-profissional | ⚠️ Pendente |
| b02-site-antigo-lento | ⚠️ Pendente |
| b03-sem-automacao | ⚠️ Pendente |
| b04-sem-presenca-digital | ⚠️ Pendente |
| b05-perder-clientes-online | ⚠️ Pendente |
| b06-sem-leads-qualificados | ⚠️ Pendente |
| b07-site-nao-aparece-google | ⚠️ Pendente |
| b08-concorrente-digital | ⚠️ Pendente |
| c01-site-institucional-pme | ⚠️ Pendente |
| c02-landing-page-conversao | ⚠️ Pendente |
| c03-app-web-negocio | ⚠️ Pendente |
| c04-ecommerce-pequeno-negocio | ⚠️ Pendente |
| c05-sistema-agendamento | ⚠️ Pendente |
| c06-automacao-atendimento | ⚠️ Pendente |
| c07-sistema-gestao-web | ⚠️ Pendente |
| c08-manutencao-software | ⚠️ Pendente |
| d01-calculadora-custo-site | ⚠️ Pendente |
| d02-calculadora-custo-app | ⚠️ Pendente |
| d03-diagnostico-maturidade-digital | ⚠️ Pendente |
| d04-calculadora-roi-automacao | ⚠️ Pendente |
| d05-checklist-presenca-digital | ⚠️ Pendente |
| e01-ia-para-pequenos-negocios | ⚠️ Pendente |
| e02-automacao-whatsapp | ⚠️ Pendente |
| e03-site-com-ia | ⚠️ Pendente |
| f01-blog-desenvolvimento-web | ⚠️ Pendente |
| f02-blog-marketing-digital | ⚠️ Pendente |

---

## Troubleshooting

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Formulário enviado mas email não chega | `formAccessKey` incorreta | Verificar key no dashboard Static Forms |
| Build emite `[WARN] formAccessKey não configurado` | Placeholder no config | Substituir pelo valor real |
| Email vai para spam | Remetente não whitelisted | Adicionar `noreply@staticforms.xyz` aos contatos |
| Redirect após envio vai para URL errada | `redirectUrl` incorreto no Static Forms dashboard | Corrigir para `/obrigado` |
