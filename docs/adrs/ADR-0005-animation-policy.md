# ADR-0005 — Politica de animacao minima

**Status:** Accepted
**Data:** 2026-04-21
**Origem:** Intake Review TASK-3 ST001 (gap CL-155)
**Supersedes:** nenhum

---

## Contexto

A rede de 36 micro-sites atende PMEs brasileiras, majoritariamente via mobile em conexoes de qualidade variavel (3G/4G). As metas do produto incluem:
- Lighthouse Performance >= 90 (mobile)
- Respeito a LGPD (menor exposicao a scripts de tracking)
- Acessibilidade WCAG 2.2 AA
- HCU (Helpful Content Update) favorecendo pages leves

Animacoes pesadas, scroll-jacking e parallax conflitam com essas metas: aumentam jank, CLS, TBT e podem causar desconforto vestibular em usuarios sensiveis.

A intake-review (CL-155) identificou ausencia de politica explicita. Este ADR registra a decisao.

---

## Decisao

### Permitido
- `fade-in` (opacity 0 -> 1) ate 200ms
- Hover subtle: `opacity`, `translate <= 4px`, `scale <= 1.02`
- Transicoes de estado de UI (botao pressed, link hover) com duracao `<= 200ms`
- `stagger` manual entre elementos com duracao total `<= 400ms` (e.g. lista de 3 itens a 80ms cada)

### Proibido
- Parallax (transform em scroll)
- Scroll-jacking / scroll-hijacking
- Autoplay de video em hero/above-the-fold
- Carrosseis com auto-rotate (slider estatico apenas ou controlado pelo usuario)
- Animacoes em `transform: scale` > 1.05
- Animacoes em cores com duracao > 200ms
- Efeitos "fancy" (blobs animados, gradient-shift em loop, etc.)

### Compliance obrigatorio
Todas as animacoes respeitam `prefers-reduced-motion: reduce`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

### Excecoes
Durations > 200ms requerem comentario inline justificando:
```css
/* animation-policy-ok: spinner exige loop contínuo (estado loading) */
.spinner { animation: spin 800ms linear infinite; }
```

---

## Consequencias

Positivas:
- Baseline de performance previsivel
- Acessibilidade default-on
- Menos bugs de motion sickness
- Menor risco de regressao ao adicionar novos sites

Negativas:
- Perda de "wow factor" em designs de landing concorrentes
- Necessidade de review manual para excecoes (spinner, progress, skeleton)

Operacionais:
- Auditoria CI via `scripts/audit-animations.ts` (TASK-3 ST003)
- `src/styles/animations.css` concentra keyframes + wrapper de reduced-motion
- Novas animacoes em componentes devem referenciar esta ADR em comentario

---

## Referencias

- WCAG 2.2 SC 2.3.3 (Animation from Interactions)
- MDN `prefers-reduced-motion`
- [docs/ANIMATIONS-INVENTORY.md](../ANIMATIONS-INVENTORY.md) (inventario atual)
- Intake Review Compare: CL-155
