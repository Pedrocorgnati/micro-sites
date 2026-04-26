# Quality Gate — Checklist Pré-Publicação de Artigos

**Pipeline:** module-11-blog-pipeline (TASK-0 ST003)  
**Uso:** Aplicar em amostra ≥ 20% dos artigos antes de publicar.  
**Comando técnico obrigatório:** `npm run validate:articles` deve passar com exit 0 antes de aplicar este checklist.

---

## Como Usar

1. Execute `npm run validate:articles` — deve retornar `✅ Validação OK` antes de prosseguir
2. Selecione artigos aleatoriamente (mínimo 20% do lote)
3. Marque cada item como `[x]` ou registre a ressalva
4. Assine ao final (obrigatório para publicação)

---

## Seção 1 — SEO (5 itens)

- [ ] **#1 Título otimizado:** Título SEO ≤ 60 caracteres, contém keyword principal na posição 1-3
- [ ] **#2 Meta description:** 50-155 caracteres, contém keyword, CTA implícito ou proposta de valor
- [ ] **#3 H1 único:** Artigo tem exatamente 1 H1, diferente do título SEO
- [ ] **#4 Hierarquia de headings:** H2 → H3 respeitada, nenhum nível pulado
- [ ] **#5 Slug kebab-case:** URL em kebab-case com keyword principal, sem caracteres especiais

## Seção 2 — GEO (5 itens)

- [ ] **#6 Resposta direta 200p:** Primeiras 200 palavras respondem EXATAMENTE à intenção de busca (tabela, lista ou definição)
- [ ] **#7 Word count ≥ 800:** Artigo tem pelo menos 800 palavras de conteúdo substancial
- [ ] **#8 Dados com fonte:** Estatísticas, números e fatos citam fonte verificável (.gov, pesquisa publicada, site oficial)
- [ ] **#9 Exemplos práticos:** Tabelas, listas, passo-a-passo ou tutoriais concretos presentes no corpo
- [ ] **#10 CTA alinhado ao funil:** TOFU → "Saiba mais" / MOFU → "Consulte" / BOFU → "Contrate/Compre"

## Seção 3 — Linkagem (3 itens)

- [ ] **#11 Links internos (mínimo 2):** Artigo tem pelo menos 2 links para outros artigos do mesmo site
- [ ] **#12 Anchor text com keyword:** Âncoras usam keyword relevante (ex: "como funciona telemedicina"), não textos genéricos como "clique aqui"
- [ ] **#13 Zero links quebrados:** Todos os links apontam para URLs válidas — verificado com `npm run validate:interlinking`

## Seção 4 — Técnico (2 itens)

- [ ] **#14 Validação técnica OK:** `npm run validate:articles` retornou exit 0 para este artigo
- [ ] **#15 Encoding UTF-8:** Arquivo salvo em UTF-8 sem BOM, caracteres especiais (ã, ç, é) renderizados corretamente

---

## Resultado da Auditoria

**Artigo auditado:** `sites/{slug}/blog/articles/{arquivo}.md`  
**Data:** ____/____/______  
**Checklist:** ____/15 itens aprovados

| Status | Critério |
|--------|----------|
| ✅ APROVADO | 15/15 itens ✓ |
| ⚠️ APROVADO COM RESSALVA | 13-14/15 itens ✓ — documentar itens falhados |
| ❌ REPROVADO | ≤ 12/15 itens ✓ — não publicar, corrigir e re-auditar |

**Itens com ressalva (se houver):**
- Item #__: ________________________________________________

**Veredito final:** [ ] APROVADO  [ ] APROVADO COM RESSALVA  [ ] REPROVADO

**Assinado por:** ________________________  
**Data de aprovação:** ____/____/______
