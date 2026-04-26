# Inventário de Animações

Data: 2026-04-18
Escopo: `src/**/*.tsx`

## Classes Tailwind em uso

| Classe | Ocorrência | Propósito | LCP/INP safe |
|--------|-----------|-----------|--------------|
| transition-all | alta | CTA buttons, cards | sim |
| transition-colors | alta | nav links, hover | sim |
| transition-opacity | média | overlays, popups | sim |
| transition-shadow | baixa | header sticky | sim |
| transition-transform | baixa | hover scale | sim |
| animate-in | baixa | entradas discretas | sim |
| animate-pulse | baixa | loading skeletons | sim |
| animate-shake | baixa | erro de form | sim |
| animate-slide | baixa | menu mobile | sim |
| animate-spin | baixa | loading spinner | sim |
| duration-150/200/300 | alta | todas <=300ms | sim |

## Arquivos (36)

Lista obtida via `grep -rln "transition-\|animate-" src/ --include="*.tsx"`.

## Diretrizes

- Nenhuma animação >300ms (INP safe).
- Nenhuma animação bloqueando LCP (sem animações em elementos above-the-fold críticos).
- `prefers-reduced-motion` deve ser respeitado via media query global (verificar em `globals.css`).
- Evitar `animate-bounce` e animações contínuas.

## Gaps cobertos
- CL-124: Animações mínimas inventariadas.
