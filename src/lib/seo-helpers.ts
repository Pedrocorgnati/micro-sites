// src/lib/seo-helpers.ts
import type { SiteConfig, BlogArticle } from '@/types';

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

export function buildCanonicalUrl(siteUrl: string, urlPath: string = '/'): string {
  const base = siteUrl.replace(/\/$/, '');
  const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${base}${normalized}`;
}

/** Gera objeto compatível com generateMetadata do Next.js App Router */
export function buildNextMetadata(config: SiteConfig, baseUrl: string) {
  const tags = buildMetaTags(config, baseUrl);
  return {
    title: tags.title,
    description: tags.description,
    keywords: config.seo.keywords,
    metadataBase: new URL(baseUrl),
    alternates: { canonical: '/' },
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
  };
}
