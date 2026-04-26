# Mapa de Interlinking — Blog Pipeline

**Gerado em:** 2026-04-11  
**Sites cobertos:** 7 | **Artigos:** 26 | **Links internos total:** 60+

## Regras de Interlinking

| Regra | Valor |
|-------|-------|
| Mínimo de links por artigo | 2 |
| Máximo de links por artigo | 5 |
| Scope | Intra-site (mesmo domínio) |
| Anchors proibidos | clique aqui, saiba mais, leia mais, aqui, link |
| Script de validação | `npm run validate:interlinking` |

---

## Site a01 — Saúde e Planos

**Cluster:** Saúde preventiva + acesso a serviços médicos

```
exame-preventivo-lista-completa
  → telemedicina-como-funciona-brasil (agendar consulta para pedir exames)
  → sintomas-que-exigem-pronto-socorro (sinais de alerta complementares)

plano-de-saude-vs-consulta-particular
  → telemedicina-como-funciona-brasil (terceira opção — telemedicina)
  → exame-preventivo-lista-completa (checklist de exames por perfil)

sintomas-que-exigem-pronto-socorro
  → telemedicina-como-funciona-brasil (alternativa para casos não urgentes)
  → plano-de-saude-vs-consulta-particular (escolha de cobertura)

telemedicina-como-funciona-brasil
  → plano-de-saude-vs-consulta-particular (comparativo de custo)
  → exame-preventivo-lista-completa (exames por faixa etária)
```

---

## Site a05 — Imóveis

**Cluster:** Compra de imóvel + documentação jurídica

```
escritura-registro-imovel
  → fgts-compra-imovel-como-usar (financiamento com FGTS)
  → laudo-vistoria-imovel (vistoria antes do registro)

fgts-compra-imovel-como-usar
  → escritura-registro-imovel (após aprovar o FGTS)
  → valor-metro-quadrado-cidade (calcular o valor justo)

laudo-vistoria-imovel
  → escritura-registro-imovel (após a vistoria aprovada)
  → fgts-compra-imovel-como-usar (usar FGTS após a vistoria)

valor-metro-quadrado-cidade
  → laudo-vistoria-imovel (validar o preço pedido)
  → fgts-compra-imovel-como-usar (usar FGTS para cobrir a diferença)
```

---

## Site a07 — MEI e Empreendedorismo

**Cluster:** Gestão do MEI + obrigações fiscais

```
desenquadramento-mei-quando-acontece
  → diferenca-mei-me-epp (próximo passo após o desenquadramento)
  → nota-fiscal-mei-como-emitir (emissão antes de crescer)

diferenca-mei-me-epp
  → mei-pode-contratar-funcionario (dúvida frequente de quem quer crescer)
  → nota-fiscal-mei-como-emitir (obrigações fiscais de cada tipo)

mei-pode-contratar-funcionario
  → diferenca-mei-me-epp (mudar de MEI se crescer além de 1 funcionário)
  → desenquadramento-mei-quando-acontece (riscos de crescer sem migrar)

nota-fiscal-mei-como-emitir
  → desenquadramento-mei-quando-acontece (receita que dispara o desenquadramento)
  → diferenca-mei-me-epp (próximo formato societário)
```

---

## Site c01 — Site Institucional PME

**Cluster:** Presença digital + escolha de hospedagem

```
site-institucional-vs-landing-page
  → custo-manutencao-site (custos após a decisão)
  → hospedagem-site-comparativo (onde hospedar o site escolhido)

custo-manutencao-site
  → hospedagem-site-comparativo (custo de hospedagem embutido)
  → site-institucional-vs-landing-page (reduzir custos com a estrutura certa)

hospedagem-site-comparativo
  → site-institucional-vs-landing-page (tipo de site influencia a hospedagem)
  → custo-manutencao-site (manutenção além da hospedagem)
```

---

## Site c02 — Landing Page e Conversão

**Cluster:** CRO + copy + estratégia de conversão

```
copy-landing-page-formula
  → landing-page-b2b-vs-b2c (copy varia por público)
  → cro-como-aumentar-conversao (testes para validar o copy)

cro-como-aumentar-conversao
  → copy-landing-page-formula (copy é o maior fator de conversão)
  → landing-page-b2b-vs-b2c (CRO difere entre B2B e B2C)

landing-page-b2b-vs-b2c
  → cro-como-aumentar-conversao (métricas específicas por modelo)
  → copy-landing-page-formula (adaptar o copy ao público)
```

---

## Site f01 — Blog Desenvolvimento Web

**Cluster:** Decisão de tecnologia + contratos + custos

```
custo-app-mobile-2026
  → contrato-desenvolvimento-software (após decidir pelo app)
  → manutencao-site-o-que-inclui (custos recorrentes pós-lançamento)

contrato-desenvolvimento-software
  → manutencao-site-o-que-inclui (serviços pós-entrega)
  → custo-app-mobile-2026 (custo do projeto que gerou o contrato)

manutencao-site-o-que-inclui
  → contrato-desenvolvimento-software (formalizar o contrato de manutenção)
  → site-wordpress-vs-next-js (influencia no custo de manutenção)

site-wordpress-vs-next-js
  → manutencao-site-o-que-inclui (manutenção difere por tecnologia)
  → contrato-desenvolvimento-software (formalizar o desenvolvimento)
```

---

## Site f02 — Blog Marketing Digital

**Cluster:** Ferramentas e plataformas de marketing/ecommerce

```
wix-para-empresas-vale-a-pena
  → shopify-vs-loja-integrada (alternativa de ecommerce)
  → migrar-site-sem-perder-seo (migrar do Wix para outra plataforma)

shopify-vs-loja-integrada
  → migrar-site-sem-perder-seo (migração entre plataformas)
  → wix-para-empresas-vale-a-pena (outra opção para comparar)

migrar-site-sem-perder-seo
  → shopify-vs-loja-integrada (destino comum de migrações)
  → wix-para-empresas-vale-a-pena (avaliar a plataforma antes de migrar)

cms-headless-o-que-e
  → shopify-vs-loja-integrada (Shopify como headless CMS de ecommerce)
  → migrar-site-sem-perder-seo (migrar para headless sem perder SEO)
```

---

## Estatísticas

| Site | Artigos | Links totais | Média |
|------|---------|-------------|-------|
| a01 | 4 | 8 | 2.0 |
| a05 | 4 | 8 | 2.0 |
| a07 | 4 | 8 | 2.0 |
| c01 | 3 | 6 | 2.0 |
| c02 | 3 | 6 | 2.0 |
| f01 | 4 | 8 | 2.0 |
| f02 | 4 | 9 | 2.25 |
| **Total** | **26** | **53+** | **2.0+** |

## Checklist de Qualidade

- [x] Todos os artigos têm ≥2 links internos
- [x] Nenhum artigo ultrapassa 5 links internos
- [x] Nenhum self-link
- [x] Nenhum anchor proibido
- [x] Todos os slugs referenciados existem no mesmo site
- [x] Clusters temáticos coerentes por site
- [x] `npm run validate:interlinking` → 26/26 ✅

---

## Ativacao Progressiva entre Ondas (CL-102 / TASK-2)

O deploy acontece em ondas (wave 1 → wave 2 → wave 3). Sites de uma onda
nao podem linkar para sites de ondas ainda nao deployadas (destino 404).
Os `crossLinks` em `sites/<slug>/config.json` carregam este risco.

### Fluxo canonico

1. **Antes do deploy da onda N**, rodar o gate:

   ```bash
   npx tsx scripts/validate-interlinking.ts --wave=N
   ```

   Falha se qualquer site da onda N tiver `crossLinks` para sites de onda > N.

2. **Apos o deploy da onda N**, ativar os links cross-wave que passam a ser
   validos (sites das ondas anteriores podem agora linkar para a onda N):

   ```bash
   npx tsx scripts/apply-cross-wave-links.ts --to-wave=N
   ```

3. **Progressivo**: repetir para N=2 e N=3.

### Regras

- `validate-interlinking.ts --wave=N` restringe a coerencia de onda aos sites
  de wave == N (em vez de validar todo o manifesto).
- Sem `--wave`, mantem o comportamento historico (valida todos os sites).
- SystemForge hosts (`SYSTEMFORGE_HOSTS`) sao sempre permitidos — independem de onda.

### Auditoria 2026-04-21 (TASK-2 ST001)

- Wave 1 → destinos observados: `c01`, `c05`, `d01` — todos wave 1.
- Resultado: **Onda 1 isolada. Sem cross-wave leak.**
