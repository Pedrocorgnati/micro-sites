# Social Proof Policy

**Versao:** v1.0 (2026-04-25 — TASK-29 ST001 / CL-593)
**Vincula:** `src/components/sections/LocalTestimonials.tsx`, `src/types/index.ts`

> Policy formal sobre quando rotular depoimentos/casos como "ilustrativos"
> vs. "reais" e o processo de coleta de consent escrito para casos reais.

---

## Princípio canonico

**Default: ilustrativo + label visível.** Qualquer depoimento, testimonial ou
case study na rede de micro-sites parte do default `kind: 'illustrative'` que
renderiza com badge "Caso ilustrativo — perfil tipico, nao cliente especifico".

**Real (sem label):** apenas com consent escrito + ja entregue + Pedro pode
nomear cliente publicamente.

**Real anonimizado (com label "Cliente real anonimizado"):** caso real entregue
mas cliente nao quer nome publico — ainda exige consent escrito que valida o
direito de uso da historia mesmo sem o nome.

## Tipos de social proof

| `kind` | Renderizacao | Quando usar | Requer consent? |
|---|---|---|---|
| `illustrative` | Card com badge "Caso ilustrativo" + perfil generico | Default antes de ter clientes reais | Nao |
| `real_named` | Card sem badge, com nome + foto + link site cliente | Cliente real + consent assinado + entrega validada | **Sim — escrito** |
| `real_anonymous` | Card com badge "Cliente real anonimizado" sem nome/foto | Cliente real + consent + nao quer expor identidade | **Sim — escrito** |

## Criterios para `real_named`

Todos abaixo devem ser TRUE:
1. Pedro entregou o trabalho (projeto fechado, NF emitida, satisfacao confirmada)
2. Cliente assinou template de consent (vide §Template abaixo)
3. Cliente revisou o testimonial exato que sera publicado (nao parafraseado)
4. Pedro tem evidencia documental do consent (PDF/email arquivado)

Sem TODOS os 4: cair para `illustrative` ou `real_anonymous`.

## Template de consent (form curto)

```
AUTORIZACAO DE USO DE TESTEMUNHO/CASE — Site SystemForge

Eu, {nome do cliente}, CPF {cpf}, autorizo a SystemForge (Pedro Corgnati,
CPF/CNPJ {x}) a publicar:

[ ] Meu nome
[ ] Foto de perfil/empresa
[ ] Link para meu site/empresa: __________
[ ] Trecho do testimonial abaixo (sem alteracoes que mudem o sentido):

> "{exatamente como sera publicado}"

Esta autorizacao e:
[ ] Por tempo indeterminado (preferido)
[ ] Por {N} meses, ate {data}

Posso revogar a autorizacao a qualquer momento via email
footstockbr@gmail.com com assunto [CONSENT-REVOKE]. Apos revogacao, o
testimonial sera removido do site em ate 5 dias uteis.

Local, data: ______________________
Assinatura: ______________________
```

Salvar PDF assinado em `~/Documents/SystemForge/consents/{YYYY-MM-DD}-{slug-cliente}.pdf` (fora do repo — confidencial). Manter referencia em `data/social-proof.json` (commitavel) com hash do PDF.

## Estrutura `data/social-proof.json` (commitavel)

```json
{
  "items": [
    {
      "site_slug": "d01-calculadora-custo-site",
      "kind": "real_named",
      "name": "Joana Silva",
      "company": "Padaria Bem-Te-Vi",
      "photo_url": "/testimonials/joana-silva.jpg",
      "quote": "Apos 3 meses do site no ar, dobramos os pedidos online.",
      "consent_pdf_hash": "sha256:abc123...",
      "consent_signed_at": "2026-05-10",
      "consent_expires_at": null
    },
    {
      "site_slug": "a02-criacao-site-mei",
      "kind": "illustrative",
      "name": "Profissional autonomo",
      "quote": "Em 30 dias, ja tinha presenca online profissional.",
      "consent_pdf_hash": null
    }
  ]
}
```

## Renderizacao no FE

`LocalTestimonials.tsx` ja foi modificado em TASK-12 com prop `kind`. Garantir que renderiza badge para `illustrative` e `real_anonymous`.

## Auditoria

A cada deploy de mudanca em testimonial:
1. Validar consent existe se `kind=real_*`
2. Validar PDF hash bate (script `scripts/audit-social-proof.ts` — futuro)
3. Bloquear merge se inconsistente

## Revogacao

Quando cliente revoga consent (email com `[CONSENT-REVOKE]`):
1. Em ate 5 dias uteis: remover entrada de `data/social-proof.json` ou trocar para `illustrative`
2. Anonimizar nome/foto em `LocalTestimonials.tsx` no proximo deploy
3. Registrar em `docs/compliance/social-proof-revocations/{YYYY-MM-DD}.md`

## Versionamento

- v1.0 (2026-04-25) — TASK-29 ST001: tipos formais + criterios + template consent + estrutura data
