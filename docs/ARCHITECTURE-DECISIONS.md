# Architecture Decisions — Micro Sites

**Projeto:** Micro Sites — Rede de Aquisição da SystemForge
**Última atualização:** 2026-04-12

Este documento registra decisões arquiteturais onde a implementação diverge intencionalmente da especificação original, ou onde uma escolha não-óbvia foi feita entre alternativas equivalentes.

---

## ADR-001: Content Format — JSON vs Markdown

**Status:** Aceito
**Data:** 2026-04-12

### Contexto

A especificação original define conteúdo de sites em arquivos Markdown (`content/*.md`). A implementação usa JSON (`content/faq.json`, `content/features.json`, etc.).

### Decisão

Manter JSON para conteúdo estruturado (FAQs, listas de features, depoimentos).

### Razões

- JSON é mais estruturado para dados tabulares — cada feature tem `title`, `description` e `icon` como campos tipados
- Parsing zero-overhead: `JSON.parse()` vs unified/remark pipeline
- `content-loader.ts` suporta ambos os formatos — Markdown pode ser adicionado futuramente para conteúdo narrativo (ex: blog posts)
- Type safety via TypeScript interfaces sem schemas Markdown adicionais

### Consequências

- Conteúdo narrativo longo (ex: artigos de blog) pode ser adicionado em Markdown sem refatoração — `content-loader.ts` já suporta
- Editores não-técnicos precisam de acesso ao JSON — considerar CMS headless se escala exigir

---

## ADR-002: Template Logic — Conditionals em page.tsx vs src/templates/

**Status:** Aceito
**Data:** 2026-04-12

### Contexto

A especificação define `src/templates/` com arquivos separados por tipo de categoria (ex: `templates/category-a.tsx`, `templates/category-d.tsx`). A implementação usa `if/else` e condicionais diretamente em `src/app/page.tsx`.

### Decisão

Manter lógica de template como conditionals em `page.tsx`.

### Razões

- Com 6 categorias (A-F), a complexidade é gerenciável em um único arquivo
- `src/templates/` adicionaria uma camada de indireção sem reduzir complexidade real
- Todos os sites compartilham o mesmo `page.tsx` — a lógica condicional é o "template engine" implícito
- Easier debugging: um arquivo para rastrear em vez de 6 templates + roteamento

### Consequências

- Se o número de categorias crescer significativamente (≥ 10-15), considerar refatorar para `src/templates/`
- Novos desenvolvedores podem estranhar a ausência de `src/templates/` — ver comentário no topo de `page.tsx`

---

## ADR-003: SEO — generateMetadata() vs Componente SEOHead

**Status:** Aceito
**Data:** 2026-04-12

### Contexto

A especificação sugere um componente centralizado `<SEOHead>` para gerenciar meta tags. A implementação usa `generateMetadata()` por rota, padrão do Next.js App Router.

### Decisão

Manter `generateMetadata()` como abordagem primária de SEO.

### Razões

- `generateMetadata()` é o padrão recomendado pelo Next.js App Router — mais idiomático e futuro-compatível
- Permite Server-Side metadata (sem hidratação client) — melhor para Core Web Vitals
- Next.js deduplica automaticamente tags `<head>` geradas por `generateMetadata()`
- `<SEOHead>` como componente React seria um anti-pattern em App Router (forçaria `'use client'` ou workarounds)
- `seo-helpers.ts` centraliza a lógica de construção — evita duplicação sem abrir mão do padrão nativo

### Consequências

- Nenhuma desvantagem técnica — abordagem atual é superior ao componente centralizado para App Router
- Cada rota declara seu próprio `generateMetadata()` com path canônico específico

---

## ADR-004: next/image — Lazy Loading Nativo vs next/image

**Status:** Revisão Futura
**Data:** 2026-04-12

### Contexto

A checklist aponta que `next/image` tem 0 imports na codebase. Imagens usam `<img>` com `loading="lazy"` manual.

### Decisão

Manter `<img>` para MVP; migrar para `next/image` em iteração futura.

### Razões

- Static export (`output: 'export'`) tem limitações com `next/image` — requer `unoptimized: true` ou Image Optimization via CDN externo
- Hostinger não oferece Image Optimization via CDN — `next/image` sem `unoptimized` quebraria o build estático
- `<img loading="lazy">` oferece lazy loading equivalente para MVP

### Consequências

- Para adicionar `next/image`: configurar `images.unoptimized: true` em `next.config.js` + migrar tags `<img>`
- Melhoria de Core Web Vitals esperada (LCP) após migração com CDN de imagens externo
