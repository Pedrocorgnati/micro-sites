# ADR-0008 — Font preload strategy (CL-634)

**Status:** Accepted
**Data:** 2026-04-25
**Origem:** TASK-7 / intake-review

## Contexto

CL-634 pedia `<link rel="preload" as="font">` explicito para `Inter`.
Estamos usando `next/font/google` (Inter + Plus_Jakarta_Sans) com
`display: 'swap'`, que ja gera tags de preload automaticas com hash
versionado e self-hosting (via `_next/static/media/*`).

## Decisao

Confiar no auto-preload do `next/font/google`. NAO adicionar
`<link rel="preload" as="font">` manual em `layout.tsx`.

## Justificativa

- `next/font/google` ja inclui `<link rel="preload" as="font" type="font/woff2" crossorigin>` no head para cada subset usado.
- Adicionar preload manual com path fixo (ex: `/fonts/inter-var.woff2`) **duplica** o request e aponta para um arquivo que o framework nao garante existir entre versoes.
- `display: 'swap'` evita FOIT, e o LCP nao depende do binario da fonte (texto e renderizado com fallback ate trocar).

## Verificacao

- DevTools -> Network filter "font": deve haver 1 request `inter-*.woff2` com `Initiator: (preload)` e `Priority: High`.
- Lighthouse "Preload key requests" nao deve sinalizar Inter.

## Consequencias

- CL-634 fechado.
- Se mudarmos para fonts self-hosted manualmente (sem `next/font`), reabrir esta ADR e voltar a preload manual.
