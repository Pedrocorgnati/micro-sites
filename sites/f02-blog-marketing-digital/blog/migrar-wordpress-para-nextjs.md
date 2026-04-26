---
title: "Como Migrar do WordPress para Next.js Sem Perder SEO"
description: "Guia técnico completo para migração WordPress → Next.js: preservando URLs, conteúdo, metadados e posicionamento no Google. Passo a passo com exemplos reais."
author: "SystemForge Digital"
date: "2026-04-05"
readingTime: "9 min"
tags: ["migrar WordPress Next.js", "WordPress para Next.js", "migração site SEO", "Next.js migração"]
---

# Como Migrar do WordPress para Next.js Sem Perder SEO

**Resposta direta:** é possível migrar WordPress para Next.js sem perder posicionamento no Google, desde que você mantenha as mesmas URLs (ou implemente redirects 301 corretos), preserva todos os metadados e recria o sitemap corretamente. O processo leva de 2 a 6 semanas dependendo do volume de conteúdo.

---

## Por Que Migrar do WordPress para Next.js?

Os motivos mais comuns que levam empresas a migrar:

- **PageSpeed mobile abaixo de 65** mesmo após otimizações no WordPress
- **Custo de hosting gerenciado premium** (Kinsta, WP Engine) acima de R$ 500/mês
- **Vulnerabilidades de segurança** recorrentes via plugins desatualizados
- **Integrações bloqueadas** que não encontram plugin adequado
- **Dependência técnica** de um único desenvolvedor WordPress

---

## O Que Pode Dar Errado (e Como Evitar)

Antes do passo a passo, os erros que destroem posicionamento:

### 1. URLs Mudaram Sem Redirect 301
**O problema:** o Google indexou `seusite.com/blog/meu-artigo/`. Se no Next.js a URL virar `seusite.com/blog/meu-artigo` (sem barra final), ou `seusite.com/artigos/meu-artigo`, o Google trata como nova página e a antiga some.

**A solução:** mapeie cada URL antiga e implemente redirect 301 no `next.config.js` ou no servidor. Mantenha os redirects por pelo menos 12 meses.

### 2. Metadados Perdidos
Títulos, meta descriptions e Open Graph que existiam via YOAST precisam ser recriados em cada página Next.js usando `generateMetadata`.

### 3. Imagens Sem Alt Text
O WordPress pode ter imagens sem alt text. Na migração, é o momento de corrigir — mas manter os alts existentes para não criar mudanças desnecessárias.

### 4. Sitemap Incorreto
O WordPress gera sitemap automático. O Next.js precisa que você implemente (manualmente ou via `next-sitemap`). Um sitemap incorreto atrasa a re-indexação em semanas.

---

## Passo a Passo da Migração

### Fase 1: Auditoria Pre-Migração (3–5 dias)

**1.1. Exportar inventário completo do WordPress**

```bash
# Via WP-CLI
wp post list --post_type=post --post_status=publish --format=csv > posts.csv
wp post list --post_type=page --post_status=publish --format=csv > pages.csv
```

Documente: total de posts, páginas, categorias, tags, imagens em `/wp-content/uploads/`.

**1.2. Mapear todas as URLs indexadas**

Use Google Search Console → Performance → Páginas para listar todas as URLs indexadas pelo Google. Exporte para CSV. Essas são as URLs que PRECISAM continuar funcionando.

**1.3. Registrar backlinks de alta autoridade**

Use Ahrefs ou Semrush para exportar os 50 backlinks mais importantes. As URLs de destino desses links são prioritárias para preservar.

**1.4. Baseline de métricas**

Documente antes da migração:
- Número de palavras-chave ranqueando (Search Console)
- Tráfego orgânico mensal
- Posição média das 20 principais palavras-chave

### Fase 2: Exportação do Conteúdo WordPress (1–2 dias)

**2.1. Exportar via REST API**

```javascript
// Exportar todos os posts em JSON
const response = await fetch('https://seuwordpress.com/wp-json/wp/v2/posts?per_page=100&_fields=id,slug,title,content,excerpt,date,categories,tags,yoast_head_json');
const posts = await response.json();
```

**2.2. Baixar todas as imagens**

```bash
# Sincronizar uploads do WordPress localmente
rsync -avz usuario@servidor:/var/www/html/wp-content/uploads/ ./public/uploads/
```

**2.3. Exportar categorias e tags**

```javascript
const categories = await fetch('https://seuwordpress.com/wp-json/wp/v2/categories?per_page=100').then(r => r.json());
const tags = await fetch('https://seuwordpress.com/wp-json/wp/v2/tags?per_page=100').then(r => r.json());
```

### Fase 3: Estrutura Next.js (3–7 dias)

**3.1. Preservar estrutura de URLs**

Se o WordPress usava `/blog/{slug}/`, configure o Next.js da mesma forma:

```
app/
  blog/
    [slug]/
      page.tsx
```

Se precisar mudar a estrutura, implemente redirects em `next.config.js`:

```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/antigo-caminho/:slug',
        destination: '/novo-caminho/:slug',
        permanent: true, // 301
      },
    ];
  },
};
```

**3.2. Recriar metadados com generateMetadata**

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  return {
    title: post.yoast_title || post.title.rendered,
    description: post.yoast_description || post.excerpt.rendered.replace(/<[^>]+>/g, ''),
    openGraph: {
      title: post.yoast_og_title,
      description: post.yoast_og_description,
      images: [post.featured_image_url],
    },
  };
}
```

**3.3. Implementar Schema.org**

```typescript
// Dados estruturados para artigo de blog
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  datePublished: post.date,
  author: { '@type': 'Person', name: post.author_name },
  publisher: {
    '@type': 'Organization',
    name: 'SystemForge Digital',
    logo: { '@type': 'ImageObject', url: 'https://seusite.com/logo.png' },
  },
};
```

### Fase 4: Sitemap e Robots (1 dia)

**4.1. Instalar next-sitemap**

```bash
npm install next-sitemap
```

```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://seusite.com.br',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
};
```

**4.2. Submeter sitemap no Search Console**

Após o lançamento, acesse Search Console → Sitemaps e submeta `https://seusite.com.br/sitemap.xml`.

### Fase 5: Lançamento (1–2 dias)

**Checklist pré-lançamento:**

- [ ] Todas as URLs do inventário testadas e respondendo 200
- [ ] Todos os redirects 301 testados
- [ ] Sitemap.xml acessível e válido
- [ ] Robots.txt não bloqueando crawlers
- [ ] SSL ativo (HTTPS) e certificado válido
- [ ] Google Analytics/GTM configurado
- [ ] Search Console verificado no novo site

**Lançamento gradual recomendado:**

Se o site tem alto tráfego, considere lançar primeiro em staging com `.htpasswd` para auditoria interna antes de apontar o DNS.

### Fase 6: Monitoramento Pós-Migração (30–90 dias)

**Semana 1:** monitore Search Console diariamente. Erros 404 aparecerão — corrija imediatamente.
**Semana 2–4:** acompanhe impressões e cliques. É normal uma queda leve seguida de recuperação.
**Mês 2–3:** as métricas devem igualar ou superar o período pré-migração.

---

## Resultado Esperado

Com migração bem executada:
- **PageSpeed mobile:** 45–65 (WordPress) → 90–99 (Next.js)
- **Tráfego orgânico:** manutenção nos primeiros 60 dias, crescimento a partir do mês 3
- **Custo operacional:** redução de 60–80% (Vercel Free vs hosting gerenciado)

**Fazemos migrações WordPress → Next.js com garantia de posicionamento.** Entre em contato para avaliação do seu site.
