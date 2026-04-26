// src/lib/seo-helpers.ts
import type { SiteConfig, BlogArticle } from '@/types';
import { CATEGORY_THEME_COLORS, DEFAULT_THEME_COLOR } from '@/lib/constants';

/** theme-color resolvido para a categoria do site (CL-341) */
export function getThemeColorForConfig(config: SiteConfig): string {
  return CATEGORY_THEME_COLORS[config.category] ?? DEFAULT_THEME_COLOR;
}

/** Viewport helper para generateViewport — Next 16 move themeColor para viewport */
export function buildNextViewport(config: SiteConfig) {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover' as const,
    themeColor: getThemeColorForConfig(config),
  };
}

export function buildMetaTags(config: SiteConfig, baseUrl: string) {
  return {
    title: config.seo.title,
    description: config.seo.description,
    keywords: config.seo.keywords.join(', '),
    canonical: `${baseUrl}/`,
    'og:title': config.seo.ogTitle ?? config.seo.title,
    'og:description': config.seo.ogDescription ?? config.seo.description,
    'og:type': 'website',
    'og:url': `${baseUrl}/`,
    'og:image': `${baseUrl}/og-image.png`,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:locale': 'pt_BR',
    'twitter:card': 'summary_large_image',
    'twitter:title': config.seo.ogTitle ?? config.seo.title,
    'twitter:description': config.seo.ogDescription ?? config.seo.description,
  };
}

export function buildArticleMetaTags(
  article: BlogArticle,
  config: SiteConfig,
  baseUrl: string
) {
  return {
    title: `${article.title} | ${config.name}`,
    description: article.description,
    canonical: `${baseUrl}/blog/${article.slug}/`,
    'og:type': 'article',
    'og:title': article.title,
    'og:description': article.description,
    'article:published_time': article.date,
    'article:author': article.author ?? '',
    'article:tag': article.tags?.join(', ') ?? '',
  };
}

export interface PageSEOInput {
  slug: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
}

export function buildSEOMetadata(config: SiteConfig, baseUrl: string, page: PageSEOInput) {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedSlug = page.slug.startsWith('/') ? page.slug : `/${page.slug}`;
  const url = `${normalizedBase}${normalizedSlug}`;
  const validBase = normalizedBase && normalizedBase.startsWith('http') ? normalizedBase : undefined;
  return {
    title: page.title,
    description: page.description,
    ...(validBase ? { metadataBase: new URL(validBase) } : {}),
    alternates: { canonical: normalizedSlug === '/' ? '/' : normalizedSlug },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: config.name,
      type: page.type ?? 'website',
      images: [{ url: `${url}/og-image.png`, width: 1200, height: 630 }],
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: page.title,
      description: page.description,
      images: [`${url}/og-image.png`],
    },
    robots: { index: true, follow: true },
    themeColor: getThemeColorForConfig(config),
  };
}

export function buildCanonicalUrl(siteUrl: string, urlPath: string = '/'): string {
  const base = siteUrl.replace(/\/$/, '');
  const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${base}${normalized}`;
}

/** Gera objeto compatível com generateMetadata do Next.js App Router */
export function buildNextMetadata(config: SiteConfig, baseUrl: string, path: string = '/') {
  const tags = buildMetaTags(config, baseUrl);
  const validBase = baseUrl && baseUrl.startsWith('http') ? baseUrl : undefined;
  return {
    title: tags.title,
    description: tags.description,
    keywords: config.seo.keywords,
    ...(validBase ? { metadataBase: new URL(validBase) } : {}),
    alternates: { canonical: path },
    openGraph: {
      title: tags['og:title'],
      description: tags['og:description'],
      url: baseUrl,
      siteName: config.name,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      locale: 'pt_BR',
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: tags['twitter:title'],
      description: tags['twitter:description'],
    },
    robots: { index: true, follow: true },
    // themeColor exposto aqui para consumo em testes e helpers.
    // Next 16+: use buildNextViewport/generateViewport para emitir <meta theme-color>.
    themeColor: getThemeColorForConfig(config),
  };
}
