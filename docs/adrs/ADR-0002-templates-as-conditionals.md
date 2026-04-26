# ADR-0002 — Templates como conditionals em page.tsx

**Status:** Accepted
**Data:** 2026-04-25 (TASK-24 ST004 / CL-318 — formalizado retroativamente)
**Decisor:** Pedro Corgnati
**Vincula:** PRD secao "Fabrica de Sites", `next.config.ts` (`output: 'export'`), `sites/*/config.json` schema

---

## Contexto

A rede de 36 micro-sites compartilha uma mesma base Next.js (`src/app/`) e
diferencia comportamento por site via:

1. `sites/{slug}/config.json` (categoria, paleta, copy, leadMagnet, hasBlog, etc)
2. `SITE_SLUG` env var no build
3. `loadSiteConfig(SITE_SLUG)` em cada page.tsx

O ponto de decisao foi: **como diferenciar layout/secoes entre categorias A..F**?

Duas opcoes consideradas:

### Opcao A — Templates `tsx` separados (uma pasta `src/templates/{cat}/`)

```
src/templates/cat-a/Home.tsx
src/templates/cat-b/Home.tsx
src/templates/cat-d/Home.tsx
...
```

E em `src/app/page.tsx`:

```tsx
const Home = (await import(`@/templates/${config.category}/Home`)).default;
return <Home config={config} />;
```

### Opcao B — Conditionals em `page.tsx` (uma page.tsx para todas categorias)

```tsx
export default function HomePage() {
  const config = loadSiteConfig(SITE_SLUG);
  return (
    <>
      <Hero variant={config.category} {...} />
      {config.category === 'D' && <CalculatorTeaser />}
      {config.hasBlog && <BlogTeaser />}
      {['A','B','C','F'].includes(config.category) && <FAQ />}
      {config.category === 'E' && <WaitlistCTA />}
    </>
  );
}
```

---

## Decisao

**Adotamos Opcao B — conditionals em `page.tsx` por rota,** com componentes
reusaveis por slot (Hero, CTA, FAQ, etc) que recebem `config` como prop.

## Justificativa

1. **Type safety simples:** `page.tsx` unico evita `dynamic import` por
   string — TS verifica todos os caminhos no build.
2. **Static export friendly:** Next.js `output: 'export'` da problemas com
   imports dinamicos baseados em string em build time. Conditionals sao
   estaticos.
3. **Sitemap conditional:** o `src/app/sitemap.ts` ja segue exatamente este
   padrao (filtra rotas por categoria) — manter consistente entre sitemap,
   robots e pages reduz drift.
4. **Discovery em IDE:** abrir `src/app/page.tsx` mostra TODO o conteudo
   possivel num arquivo so. Em templates, precisaria abrir 6+ pastas.
5. **CSS shared:** Tailwind purga apenas o que esta em arquivos importados.
   Templates separados rendem CSS bloat se um slug nao usa Cat-D.
6. **Diff de PRs:** mudar copy de Cat A vs Cat D fica em arquivos diferentes
   — mais facil de revisar.

## Consequencias

### Positivas

- Build time menor (sem dynamic imports)
- TypeScript valida 100% das ramificacoes
- Adicionar uma nova categoria = adicionar conditional + componente, nao nova pasta
- Coverage de testes mais facil (uma page com branches > N pages com 1 branch cada)

### Negativas (e mitigacoes)

- **`page.tsx` pode crescer.** Mitigacao: extrair Sections (`<HeroD />`,
  `<HeroA />`) e referenciar a partir do conditional. Manter `page.tsx` < 200 linhas.
- **Conditionals podem virar spaghetti.** Mitigacao: agrupar por categoria,
  comentar cada bloco com cabecalho `{/* Cat D — Calculadora */}`. Refatorar para
  switch quando >5 conditionals na mesma page.

## Alternativas consideradas

### Opcao A — Templates `tsx` separados

Considerada e descartada. Motivo principal: incompatibilidade pratica com `output: 'export'` + duplicacao desnecessaria para variacoes pequenas (90% do conteudo e identico, so muda hero/ctas/secoes opcionais).

### Opcao C — Generators de codigo (codegen pre-build)

Considerada brevemente. Descartada por adicionar mais um passo no build,
mais um lugar para drift. Conditionals sao runtime/compile-time da prop type
em vez disso.

## Referencias no codigo

- `src/app/page.tsx` — exemplo canonico (Hero + conditionals por categoria)
- `src/app/sitemap.ts` — mesmo padrao para rotas
- `src/lib/config-loader.ts` — `loadSiteConfig` que alimenta os conditionals
- `src/types/index.ts` — `PAGE_ROUTES` + `Category` type union

## Revisao

A cada nova categoria (G, H, ...) ou se `page.tsx` exceder 300 linhas, revisitar
esta decisao. Especialmente se um nicho exigir layout RADICALMENTE diferente
(ex: SaaS dashboard) — neste caso pode justificar Opcao A para aquela categoria
especifica.

## Versionamento

- v1.0 (2026-04-25) — TASK-24 ST004 formaliza decisao retroativa
