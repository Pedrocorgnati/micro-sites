---
title: Como Migrar um Site Sem Perder o SEO
description: >-
  Guia completo para migrar um site mantendo rankings e tráfego orgânico.
  Checklist de 20 itens, redirecionamentos e monitoramento pós-migração.
slug: migrar-site-sem-perder-seo
date: '2026-04-09'
author: SystemForge
tags:
  - migração de site
  - SEO
  - 301 redirect
  - Google Search Console
readingTime: 11
category: Caso de Uso
funnelStage: MOFU
searchIntent: How-to
siteSlug: f02-blog-marketing-digital
dateModified: '2026-04-09'
authorMeta:
  name: Equipe SystemForge
  url: 'https://systemforge.com.br/sobre'
---

# Como Migrar um Site Sem Perder o SEO

Migração de site mal executada é uma das causas mais comuns de colapso de tráfego orgânico. Empresas que levaram meses ou anos para construir posições no Google perdem tudo em uma semana por não seguir um processo estruturado. Este guia mostra exatamente o que fazer, em qual ordem, com ferramentas gratuitas.

## Checklist de 20 Itens por Fase

### Pré-migração
1. Crawl completo do site atual (Screaming Frog)
2. Exportar todas as URLs indexadas do Google Search Console
3. Identificar as 20–50 páginas com mais tráfego no GA4
4. Mapear todos os backlinks externos (Ahrefs Webmaster Tools free)
5. Listar todas as integrações: GA4, GSC, Facebook Pixel, chat, formulários
6. Documentar a estrutura de URLs atual (categorias, slugs, parâmetros)
7. Fazer backup completo do site e banco de dados

### Durante a migração
8. Configurar staging environment — nunca migre direto em produção
9. Implementar todos os redirecionamentos 301 antes do go-live
10. Verificar robots.txt — não bloquear o Googlebot inadvertidamente
11. Gerar e submeter novo sitemap.xml
12. Migrar metadados (title, description, canonical, hreflang) de todas as páginas
13. Verificar que schema markup (structured data) foi preservado

### Pós-migração
14. Resubmeter sitemap no Google Search Console
15. Solicitar reindexação das principais páginas via GSC
16. Monitorar erros 404 diariamente na primeira semana
17. Verificar cobertura de índice no GSC (crawling e indexação)
18. Acompanhar ranking das top 20 páginas por 4–6 semanas
19. Monitorar tráfego orgânico vs período anterior
20. Checar todos os links internos — nenhum deve apontar para URLs antigas

---

## Por Que a Migração Mal Feita Destrói o SEO

### Perda de backlinks e PageRank

Cada vez que o Google encontra um link externo apontando para uma URL que não existe mais (404), esse link deixa de transferir autoridade. Se o site acumulou 500 backlinks ao longo de 3 anos e a migração quebrou 200 URLs sem redirecionar, você perdeu instantaneamente uma fração significativa da sua autoridade de domínio.

O redirecionamento 301 ("permanente") preserva entre 90–99% do PageRank do link original. É a única forma de migrar sem destruir o equity de link construído.

### Conteúdo duplicado pós-migração

Se o site antigo e o novo ficam acessíveis simultaneamente — mesmo que por poucos dias — o Google pode encontrar o mesmo conteúdo em duas URLs diferentes e dividir a autoridade entre elas, ou escolher indexar a versão errada. Isso causa confusão de sinalização que pode levar semanas para resolver.

### URLs quebradas no índice

O Google demora para recrawlear todas as URLs de um site. Mesmo após a migração, o índice do Google contém as URLs antigas por semanas. Se não houver redirecionamentos, os usuários que chegam via busca orgânica encontram páginas 404 — o que aumenta bounce rate, sinaliza negativamente para o Google e resulta em queda de posição.

---

## Os 3 Tipos de Migração e Seus Riscos

### Tipo 1: Migração de Domínio

Trocar o domínio (ex: de empresa.com.br para empresa.com) mantendo a plataforma e a estrutura de URLs.

**Risco:** Alto. Backlinks externos apontam para o domínio antigo — todos precisam ser redirecionados. O Google trata domínios diferentes como sites diferentes, mesmo com conteúdo idêntico.

**Processo específico:** No Google Search Console, use a ferramenta "Mudança de endereço" para informar o Google sobre a migração. Configure redirecionamentos 301 de todas as URLs do domínio antigo para o novo. Mantenha o domínio antigo com redirecionamentos ativos por pelo menos 12 meses.

### Tipo 2: Migração de Plataforma

Mudar de WordPress para Next.js, de Shopify para Loja Integrada, ou qualquer troca de CMS mantendo o domínio.

**Risco:** Médio-Alto. A estrutura de URLs frequentemente muda entre plataformas, e funcionalidades de SEO (como metadados e structured data) precisam ser reimplementadas.

**O que verificar:** a nova plataforma gera URLs amigáveis? Os title tags e meta descriptions foram migrados? O sitemap.xml está acessível? Os redirects de URLs que mudaram estão configurados?

Se você está pensando em trocar de plataforma de e-commerce — como de Wix para Shopify ou Loja Integrada — leia nossa análise comparativa antes: [Shopify vs Loja Integrada: Qual é Melhor no Brasil](/blog/shopify-vs-loja-integrada) e [Wix para Empresas: Vale a Pena em 2026?](/blog/wix-para-empresas-vale-a-pena).

### Tipo 3: Migração de Estrutura de URLs

Manter domínio e plataforma, mas mudar a arquitetura de URLs — ex.: de `/categoria/produto-123` para `/categoria/nome-do-produto`.

**Risco:** Médio. Menor escopo do que os outros tipos, mas os redirects precisam ser mapeados com precisão.

---

## Pré-Migração: O Que Fazer com Antecedência

### Crawl completo com Screaming Frog

O Screaming Frog (gratuito até 500 URLs, pago para sites maiores) rastreia seu site como o Googlebot e exporta uma lista completa de todas as URLs, seus metadados, status HTTP, links internos e externos.

Use esta lista para:
- Identificar todas as URLs que precisarão de redirect
- Verificar quais páginas têm title/description/canonical configurados
- Detectar páginas com erros existentes antes da migração

### Exportar URLs do Google Search Console

Em Search Console → Desempenho → Páginas, exporte todas as URLs que recebem impressões orgânicas. Estas são as páginas que o Google conhece e indexou — qualquer uma delas que deixar de existir precisa de redirect.

### Identificar top pages no GA4

Em GA4, veja as páginas por tráfego orgânico dos últimos 6 meses. As top 20–50 páginas são as que mais importa proteger — qualquer queda de posição nelas terá impacto direto no tráfego.

---

## Durante a Migração: Redirecionamentos 301 em Bloco

Para sites em WordPress, redirecionamentos em bloco são configurados via plugin (Redirection, Rank Math SEO) ou diretamente no `.htaccess`:

```
# Exemplo de redirect individual no .htaccess
Redirect 301 /artigo-antigo/ https://novodominio.com.br/artigo-novo/

# Redirect de categoria inteira
RedirectMatch 301 ^/blog/categoria-velha/(.*)$ https://novodominio.com.br/blog/categoria-nova/$1
```

Para Next.js, os redirects são configurados em `next.config.js`:

```js
// Exemplo de configuração de redirects no Next.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/artigo-antigo',
        destination: '/blog/artigo-novo',
        permanent: true, // 301
      },
    ]
  },
}
```

**Regra crítica:** nunca crie cadeias de redirects (A → B → C). O Google segue redirects em cadeia, mas perde PageRank a cada hop. Sempre redirecione diretamente da URL antiga para a URL final.

---

## Ferramentas Gratuitas para a Migração

| Ferramenta | Função | Custo |
|---|---|---|
| Screaming Frog SEO Spider | Crawl completo do site (até 500 URLs) | Gratuito |
| Google Search Console | Monitoramento de indexação, erros 404, sitemap | Gratuito |
| Ahrefs Webmaster Tools | Análise de backlinks do seu domínio | Gratuito (domínios verificados) |
| Google Analytics 4 | Monitoramento de tráfego pré e pós migração | Gratuito |
| Redirect Checker (online) | Verificar status HTTP e cadeias de redirect | Gratuito |
| XML Sitemap Generator | Gerar sitemap.xml automaticamente | Gratuito |

---

## Pós-Migração: Monitoramento nas Primeiras Semanas

### Semana 1–2: Monitoramento de erros

Acesse Search Console diariamente → Cobertura → Erros. Qualquer página com erro 404 que ainda tinha tráfego orgânico precisa de redirect imediato.

### Semana 2–4: Acompanhar indexação

Em Search Console → Inspeção de URL, verifique as top páginas para confirmar que estão sendo indexadas na URL nova, não na antiga.

### Semana 4–8: Acompanhar rankings

Use qualquer ferramenta de monitoramento de posição (Google Search Console, Semrush, Ahrefs) para comparar as posições das top 20 páginas pré vs pós migração.

---

## Quanto Tempo Para Recuperar o Tráfego?

A recuperação depende do tamanho do site, da qualidade dos redirects e da competitividade do nicho:

| Cenário | Tempo de recuperação esperado |
|---|---|
| Migração de domínio bem feita (site pequeno, 50 páginas) | 2–4 semanas |
| Migração de plataforma com redirects completos | 3–6 semanas |
| Migração com redirects incompletos ou cadeia | 8–16 semanas |
| Migração sem redirects | Pode não recuperar — reinicia do zero |

A queda inicial de tráfego após a migração é normal — o Google está recrawleando e reprocessando o site. O problema é quando a queda não se recupera nas semanas seguintes, o que indica erros na migração.

---

## Conclusão

Migração de site é um procedimento cirúrgico — feito com planejamento e precisão, preserva anos de trabalho em SEO. Feito de forma improvisada, pode destruir em dias o que levou anos para construir.

O investimento em um processo estruturado — crawl antes, redirects completos, monitoramento pós — custa algumas horas de trabalho e evita semanas ou meses de recuperação de tráfego.

**Está planejando uma migração e quer garantir que o SEO seja preservado?** Entre em contato com os detalhes do projeto e receba uma avaliação de risco gratuita antes de começar.
