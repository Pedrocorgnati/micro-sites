# TASK-2 — Quality Audit: Blog Articles

**Data:** 2026-04-11  
**Scope:** 26 artigos em 7 sites  
**Resultado:** ✅ 26/26 aprovados

## Resumo por Site

| Site | Artigos | Status | Palavras (média) |
|------|---------|--------|-----------------|
| a01 | 4 | ✅ OK | ~923 |
| a05 | 4 | ✅ OK | ~1077 |
| a07 | 4 | ✅ OK | ~1020 |
| c01-site-institucional-pme | 3 | ✅ OK | ~1073 |
| c02-landing-page-conversao | 3 | ✅ OK | ~1354 |
| f01-blog-desenvolvimento-web | 4 | ✅ OK | ~1508 |
| f02-blog-marketing-digital | 4 | ✅ OK | ~1405 |

## Artigos por Arquivo

| Arquivo | Palavras | Leitura | Status |
|---------|----------|---------|--------|
| a01/exame-preventivo-lista-completa.md | 1006 | 6 min | ✅ |
| a01/plano-de-saude-vs-consulta-particular.md | 881 | 5 min | ✅ |
| a01/sintomas-que-exigem-pronto-socorro.md | 954 | 5 min | ✅ |
| a01/telemedicina-como-funciona-brasil.md | 852 | 5 min | ✅ |
| a05/escritura-registro-imovel.md | 1069 | 6 min | ✅ |
| a05/fgts-compra-imovel-como-usar.md | 1170 | 6 min | ✅ |
| a05/laudo-vistoria-imovel.md | 1043 | 6 min | ✅ |
| a05/valor-metro-quadrado-cidade.md | 1024 | 6 min | ✅ |
| a07/desenquadramento-mei-quando-acontece.md | 1140 | 6 min | ✅ |
| a07/diferenca-mei-me-epp.md | 1003 | 6 min | ✅ |
| a07/mei-pode-contratar-funcionario.md | 910 | 5 min | ✅ |
| a07/nota-fiscal-mei-como-emitir.md | 1027 | 6 min | ✅ |
| c01-site-institucional-pme/custo-manutencao-site.md | 1122 | 6 min | ✅ |
| c01-site-institucional-pme/hospedagem-site-comparativo.md | 1118 | 6 min | ✅ |
| c01-site-institucional-pme/site-institucional-vs-landing-page.md | 980 | 5 min | ✅ |
| c02-landing-page-conversao/copy-landing-page-formula.md | 1604 | 9 min | ✅ |
| c02-landing-page-conversao/cro-como-aumentar-conversao.md | 1225 | 7 min | ✅ |
| c02-landing-page-conversao/landing-page-b2b-vs-b2c.md | 1234 | 7 min | ✅ |
| f01-blog-desenvolvimento-web/contrato-desenvolvimento-software.md | 1549 | 8 min | ✅ |
| f01-blog-desenvolvimento-web/custo-app-mobile-2026.md | 1545 | 8 min | ✅ |
| f01-blog-desenvolvimento-web/manutencao-site-o-que-inclui.md | 1532 | 8 min | ✅ |
| f01-blog-desenvolvimento-web/site-wordpress-vs-next-js.md | 1406 | 8 min | ✅ |
| f02-blog-marketing-digital/cms-headless-o-que-e.md | 1511 | 8 min | ✅ |
| f02-blog-marketing-digital/migrar-site-sem-perder-seo.md | 1423 | 8 min | ✅ |
| f02-blog-marketing-digital/shopify-vs-loja-integrada.md | 1358 | 7 min | ✅ |
| f02-blog-marketing-digital/wix-para-empresas-vale-a-pena.md | 1329 | 7 min | ✅ |

## Issues Corrigidos Durante Revisão

- **18 artigos** tinham `category: "How-to"` ou `category: "Comparison"` → corrigido para `"Caso de Uso"` (How-to) e `"Ferramenta"` (comparativos de ferramentas/plataformas)
- Causa raiz: confusão entre campos `category` (enum de 5 valores) e `searchIntent` (How-to, Comparison, etc.)

## Critérios Validados

- ✅ Frontmatter completo (slug, title, description, date, author, tags, readingTime, category, funnelStage, searchIntent, siteSlug)
- ✅ Slug regex `[a-z0-9-]+`
- ✅ Title 10–60 chars
- ✅ Description 50–155 chars
- ✅ Date formato YYYY-MM-DD
- ✅ Contagem de palavras ≥ 800 (mínimo: 852, máximo: 1604)
- ✅ Category dentro do enum válido
