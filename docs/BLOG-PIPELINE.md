# BLOG-PIPELINE — Pipeline de Publicação de Artigos

**Projeto:** Micro Sites — Rede de Aquisição SystemForge  
**Fonte:** module-11-blog-pipeline TASK-0 ST003  
**Versão:** v1.0 | **Data:** 2026-04-11

---

## Pipeline Visual

```
Brief → Redação → Revisão → QA → Publicação
  │         │         │       │        │
  ▼         ▼         ▼       ▼        ▼
INTAKE   .md file  quality  validate  deploy
topics   +front-   -gate    :articles  commit
         matter    review   exit 0
```

### Passos Detalhados

```
┌─────────────────────────────────────────────────────┐
│  1. BRIEF — Definir tópico                          │
│     - Keyword principal mapeada em clusters         │
│     - Intenção de busca: How-to|Comparison|Product  │
│     - Funil: TOFU|MOFU|BOFU                         │
│     - Site de destino: a01, c01-..., f01-...        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  2. REDAÇÃO — Criar arquivo .md                     │
│     - Frontmatter válido (TASK-0 ST001 schema)      │
│     - Resposta direta 200p (GEO optimization)       │
│     - ≥ 800 palavras substanciais                   │
│     - H1 único + hierarquia H2→H3                   │
│     - CTA alinhado ao funnel stage                  │
│     - Salvar em sites/{slug}/blog/articles/         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  3. REVISÃO AUTOMÁTICA                              │
│     npm run validate:articles --slug {site}         │
│     - Zod schema: title ≤60, description 50-155     │
│     - Word count ≥ 800 palavras                     │
│     - Slug kebab-case                               │
│     Exit 0 = passou | Exit 1 = falhou               │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  4. INTERLINKING                                    │
│     - Adicionar 2-5 links internos por artigo       │
│     - Anchor text com keyword (não genérico)        │
│     npm run validate:interlinking                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  5. QUALITY GATE (amostra ≥ 20%)                   │
│     scripts/quality-gate.md — 15 itens              │
│     APROVADO|APROVADO COM RESSALVA|REPROVADO        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  6. INDEXAÇÃO                                       │
│     npm run generate:blog-index                     │
│     → sites/{slug}/blog-index.json                  │
│     (alimenta Fuse.js search component)             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  7. PUBLICAÇÃO                                      │
│     npm run build (chama prebuild automaticamente)  │
│     → prebuild valida configs + artigos + índices   │
│     → next build gera páginas estáticas             │
│     → commit:static → deploy Hostinger              │
└─────────────────────────────────────────────────────┘
```

---

## GEO Optimization

**GEO (Generative Engine Optimization)** adapta artigos para aparecer em respostas de modelos de IA (ChatGPT, Gemini, Perplexity, Copilot).

### Regras de GEO

| Regra | Valor | Implementação |
|-------|-------|---------------|
| Resposta direta | 200 palavras máx | Primeira seção do artigo |
| Formato aceito | Tabela, lista, definição | Renderiza em snippet de IA |
| Keyword no H1 | Obrigatório | Posição 1-3 na frase |
| Dados com fonte | Obrigatório | Referências verificáveis |
| Exemplos práticos | Obrigatório | Tabelas, checklists, passos |

### Template de Resposta Direta (200p)

```markdown
## Resposta Rápida

| Aspecto | Opção A | Opção B |
|---------|---------|---------|
| Custo   | R$ X    | R$ Y    |
| Tempo   | Z dias  | W dias  |
| Melhor para | Caso 1 | Caso 2 |

*[Resumo de 2-3 frases respondendo à query]*
```

---

## Estratégia de Interlinking

### Regras Canonicas (INT-074)

| Regra | Valor | Validação |
|-------|-------|-----------|
| Links mínimos | 2 por artigo | `npm run validate:interlinking` |
| Links máximos | 5 por artigo | Aviso (não falha) |
| Anchor text | Keyword relevante | Script blocklist |
| Self-link | Proibido | Script filename check |
| Sites com < 3 artigos | Validação pulada | Script threshold |

### Anchors Proibidos

Os seguintes textos de âncora são bloqueados pelo script de validação:

> "clique aqui", "saiba mais", "leia mais", "acesse aqui", "veja aqui", "veja mais", "aqui", "link", "este artigo", "este post"

### Exemplo de Interlinking Correto

```markdown
<!-- CORRETO ✓ -->
Saiba como [o processo de agendamento online funciona](/blog/agendamento-consulta-online)
antes de contratar o plano.

<!-- ERRADO ✗ — anchor genérico -->
[Clique aqui](/blog/agendamento-consulta-online) para saber mais.
```

---

## Estrutura de Arquivos

```
sites/
├── a01/
│   └── blog/
│       ├── articles/          ← artigos .md
│       │   ├── artigo-1.md
│       │   └── artigo-2.md
│       └── blog-index.json    ← gerado por generate-blog-index.ts
├── c01-site-institucional-pme/
│   └── blog/
│       └── articles/
└── f01-blog-desenvolvimento-web/
    └── blog/
        └── articles/

scripts/
├── validate-articles.ts       ← CLI: validação frontmatter + word count
├── generate-blog-index.ts     ← CLI: gera blog-index.json por site
├── pre-build.ts               ← Orchestrator do prebuild
└── quality-gate.md            ← Checklist humano (15 itens)

docs/
└── BLOG-PIPELINE.md           ← Este arquivo
    INTERLINKING-MAP.md        ← Criado em TASK-3
    TASK-2-QUALITY-AUDIT.md    ← Criado em TASK-2
```

---

## Volumes e Metas

| Onda | Módulos | Meta | Sites-alvo |
|------|---------|------|------------|
| Onda 1 | 7-10 | ~56 artigos | Todos os 20 sites |
| Onda 2 | 11 (TASK-2) | ≥ 40 artigos | A01, A05, A07, C01, C02, F01, F02 |
| **Total** | | **≥ 96 artigos** | |

---

## Scripts de Pipeline

| Comando | O que faz | Quando usar |
|---------|-----------|-------------|
| `npm run validate:articles` | Valida frontmatter + word count | Antes de cada commit |
| `npm run generate:blog-index` | Gera JSON de busca por site | Após criar/editar artigos |
| `npm run validate:interlinking` | Valida links internos + anchors | Após TASK-3 |
| `npm run validate:all` | Todos os checks em sequência | Antes de build |
| `npm run prebuild` | validate:articles + generate:blog-index | Automático via next build |

---

## Erros Comuns e Correções

| Erro | Causa | Correção |
|------|-------|---------|
| `title: máximo 60 chars` | Título SEO longo | Encurtar para keyword + diferencial |
| `description: 50 chars mín` | Meta description ausente ou curta | Adicionar descripção 50-155 chars |
| `slug: kebab-case` | Slug com acento ou espaço | Substituir por `a-z0-9-` apenas |
| `N palavras (mínimo 800)` | Artigo raso | Expandir com exemplos, tabelas, FAQ |
| `N links (mínimo 2)` | Sem interlinking | Adicionar links em contexto relevante |
