// src/integration/__tests__/seo-pipeline.integration.test.ts
//
// Testes de integração: pipeline completo config → SEO helpers
//
// Cobre:
//   - buildMetaTags: propagação correta de campos SEO
//   - buildArticleMetaTags: meta de artigo de blog
//   - buildNextMetadata: compatibilidade com generateMetadata do Next.js
//   - buildCanonicalUrl: normalização de URLs
//   - Pipeline end-to-end: loadSiteConfig → buildNextMetadata com dados reais

import { describe, it, expect } from 'vitest';
import { loadSiteConfig } from '@/lib/content-loader';
import { loadBlogArticles } from '@/lib/content-loader';
import {
  buildMetaTags,
  buildArticleMetaTags,
  buildNextMetadata,
  buildCanonicalUrl,
} from '@/lib/seo-helpers';
import { SLUG_D01, buildMinimalConfig, buildBlogArticle } from '../helpers/fixtures';

const BASE_URL = 'https://d01.systemforge.com.br';

// ─── Cenário 1: buildMetaTags com config real ────────────────────────────────

describe('buildMetaTags — integração com config real (d01)', () => {
  it('pipeline completo: loadSiteConfig → buildMetaTags produz tags válidas', () => {
    const config = loadSiteConfig(SLUG_D01);
    const tags = buildMetaTags(config, BASE_URL);

    // Título e descrição propagados do config
    expect(tags.title).toBe(config.seo.title);
    expect(tags.description).toBe(config.seo.description);

    // Keywords como string separada por vírgulas
    expect(tags.keywords).toBe(config.seo.keywords.join(', '));
    expect(tags.keywords).toBeTruthy();

    // OG tags obrigatórias
    expect(tags['og:type']).toBe('website');
    expect(tags['og:locale']).toBe('pt_BR');
    expect(tags['og:image']).toBe(`${BASE_URL}/og-image.png`);

    // Twitter card
    expect(tags['twitter:card']).toBe('summary_large_image');
  });

  it('canonical inclui base URL sem trailing slash duplicado', () => {
    const config = loadSiteConfig(SLUG_D01);
    const tags = buildMetaTags(config, BASE_URL);

    expect(tags.canonical).toBe(`${BASE_URL}/`);
    expect(tags.canonical).not.toMatch(/\/\/$/); // não termina com //
  });

  it('og:title usa ogTitle do config quando disponível, senão seo.title', () => {
    const configSemOgTitle = buildMinimalConfig('C', {
      seo: {
        title: 'Título SEO',
        description: 'Descrição suficientemente longa para passar na validação aqui.',
        keywords: ['kw1'],
        ogTitle: undefined,
      },
    });
    const tags = buildMetaTags(configSemOgTitle, BASE_URL);
    expect(tags['og:title']).toBe('Título SEO');

    const configComOgTitle = buildMinimalConfig('C', {
      seo: {
        title: 'Título SEO',
        description: 'Descrição suficientemente longa para passar na validação aqui.',
        keywords: ['kw1'],
        ogTitle: 'Título OG Customizado',
      },
    });
    const tagsComOg = buildMetaTags(configComOgTitle, BASE_URL);
    expect(tagsComOg['og:title']).toBe('Título OG Customizado');
  });

  it('og:url aponta para base URL do site', () => {
    const config = loadSiteConfig(SLUG_D01);
    const tags = buildMetaTags(config, BASE_URL);
    expect(tags['og:url']).toBe(`${BASE_URL}/`);
  });

  it('og:image:width e height seguem padrão OG (1200x630)', () => {
    const config = loadSiteConfig(SLUG_D01);
    const tags = buildMetaTags(config, BASE_URL);
    expect(tags['og:image:width']).toBe('1200');
    expect(tags['og:image:height']).toBe('630');
  });
});

// ─── Cenário 2: buildArticleMetaTags com artigo real ────────────────────────

describe('buildArticleMetaTags — integração com artigo real', () => {
  it('pipeline: loadSiteConfig + loadBlogArticles → buildArticleMetaTags', async () => {
    const config = loadSiteConfig(SLUG_D01);
    const articles = await loadBlogArticles(SLUG_D01);
    const article = articles[0]; // mais recente

    const tags = buildArticleMetaTags(article, config, BASE_URL);

    // Título combina artigo + site
    expect(tags.title).toContain(article.title);
    expect(tags.title).toContain(config.name);

    // Canonical aponta para URL do artigo
    expect(tags.canonical).toContain('/blog/');
    expect(tags.canonical).toContain(article.slug);

    // OG type para artigo
    expect(tags['og:type']).toBe('article');

    // Data de publicação no formato ISO
    expect(tags['article:published_time']).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('article:published_time corresponde à data do artigo', async () => {
    const config = loadSiteConfig(SLUG_D01);
    const articles = await loadBlogArticles(SLUG_D01);
    const article = articles[0];

    const tags = buildArticleMetaTags(article, config, BASE_URL);
    expect(tags['article:published_time']).toBe(article.date);
  });

  it('funciona com artigo de fixture sem author (campo opcional)', () => {
    const config = buildMinimalConfig('D', { slug: 'd01-calculadora-custo-site' });
    const article = buildBlogArticle({ author: undefined });
    const tags = buildArticleMetaTags(article, config, BASE_URL);

    // Não lança erro — author é opcional
    expect(tags['article:author']).toBe('');
    expect(tags.title).toBeTruthy();
  });
});

// ─── Cenário 3: buildNextMetadata — compatibilidade App Router ───────────────

describe('buildNextMetadata — integração com Next.js App Router', () => {
  it('pipeline: loadSiteConfig → buildNextMetadata retorna shape correto', () => {
    const config = loadSiteConfig(SLUG_D01);
    const metadata = buildNextMetadata(config, BASE_URL);

    // Campos obrigatórios para generateMetadata
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
    expect(Array.isArray(metadata.keywords)).toBe(true);

    // metadataBase é URL object
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.metadataBase!.href).toBe(`${BASE_URL}/`);

    // alternates.canonical
    expect(metadata.alternates?.canonical).toBe('/');
  });

  it('openGraph tem todos os campos obrigatórios', () => {
    const config = loadSiteConfig(SLUG_D01);
    const metadata = buildNextMetadata(config, BASE_URL);
    const og = metadata.openGraph;

    expect(og?.title).toBeTruthy();
    expect(og?.description).toBeTruthy();
    expect(og?.type).toBe('website');
    expect(og?.locale).toBe('pt_BR');
    expect(og?.images).toBeDefined();
    expect(Array.isArray(og?.images) && og!.images!.length > 0).toBe(true);
  });

  it('twitter card está presente com summary_large_image', () => {
    const config = loadSiteConfig(SLUG_D01);
    const metadata = buildNextMetadata(config, BASE_URL);

    expect(metadata.twitter?.card).toBe('summary_large_image');
    expect(metadata.twitter?.title).toBeTruthy();
    expect(metadata.twitter?.description).toBeTruthy();
  });

  it('robots permite indexação (index: true, follow: true)', () => {
    const config = loadSiteConfig(SLUG_D01);
    const metadata = buildNextMetadata(config, BASE_URL);

    expect(metadata.robots?.index).toBe(true);
    expect(metadata.robots?.follow).toBe(true);
  });

  it('openGraph.siteName corresponde ao config.name', () => {
    const config = loadSiteConfig(SLUG_D01);
    const metadata = buildNextMetadata(config, BASE_URL);

    expect(metadata.openGraph?.siteName).toBe(config.name);
  });

  it('keywords propagados do config.seo.keywords', () => {
    const config = loadSiteConfig(SLUG_D01);
    const metadata = buildNextMetadata(config, BASE_URL);

    expect(metadata.keywords).toEqual(config.seo.keywords);
  });
});

// ─── Cenário 4: buildCanonicalUrl — normalização ──────────────────────────────

describe('buildCanonicalUrl — normalização de URLs', () => {
  it('retorna URL com trailing slash para home', () => {
    const url = buildCanonicalUrl('https://d01.systemforge.com.br', '/');
    expect(url).toBe('https://d01.systemforge.com.br/');
  });

  it('normaliza path sem barra inicial', () => {
    const url = buildCanonicalUrl('https://d01.systemforge.com.br', 'blog');
    expect(url).toBe('https://d01.systemforge.com.br/blog');
  });

  it('normaliza base URL com trailing slash', () => {
    const url = buildCanonicalUrl('https://d01.systemforge.com.br/', '/blog/artigo');
    expect(url).toBe('https://d01.systemforge.com.br/blog/artigo');
  });

  it('constrói URL de artigo de blog corretamente', () => {
    const url = buildCanonicalUrl(BASE_URL, '/blog/custo-criar-site-2026/');
    expect(url).toBe(`${BASE_URL}/blog/custo-criar-site-2026/`);
    expect(url).toMatch(/^https:\/\//);
  });
});

// ─── Cenário 5: Consistência cross-campo SEO ─────────────────────────────────

describe('SEO cross-field consistency — config real', () => {
  it('seo.title do d01 não excede 60 chars (SITE_LIMITS.titleMaxLength)', () => {
    const config = loadSiteConfig(SLUG_D01);
    expect(config.seo.title.length).toBeLessThanOrEqual(60);
  });

  it('seo.description do d01 não excede 155 chars (SITE_LIMITS.descriptionMaxLength)', () => {
    const config = loadSiteConfig(SLUG_D01);
    expect(config.seo.description.length).toBeLessThanOrEqual(155);
  });

  it('seo.keywords do d01 tem entre 1 e 6 itens (SITE_LIMITS.keywordsMax)', () => {
    const config = loadSiteConfig(SLUG_D01);
    expect(config.seo.keywords.length).toBeGreaterThanOrEqual(1);
    expect(config.seo.keywords.length).toBeLessThanOrEqual(6);
  });

  it('og:image é URL absoluta com protocolo HTTPS', () => {
    const config = loadSiteConfig(SLUG_D01);
    const tags = buildMetaTags(config, BASE_URL);
    expect(tags['og:image']).toMatch(/^https:\/\//);
  });
});
