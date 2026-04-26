// src/lib/schema-markup.ts
import type { SiteConfig, BlogArticle, SchemaType } from '@/types';

type JsonLD = Record<string, unknown>;

export function buildOrganizationSchema(config: SiteConfig, baseUrl: string): JsonLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: baseUrl,
    logo: `${baseUrl}/brand/sf-logo.webp`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${config.cta.whatsappNumber}`,
      contactType: 'customer service',
    },
  };
}

export function buildFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): JsonLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function buildHowToSchema(
  steps: Array<{ title: string; desc: string }>,
  config: SiteConfig
): JsonLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Como ${config.name.toLowerCase()} funciona`,
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.desc,
    })),
  };
}

export function buildLocalBusinessSchema(config: SiteConfig, baseUrl: string): JsonLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: config.name,
    url: baseUrl,
    telephone: `+${config.cta.whatsappNumber}`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BR',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
    },
  };
}

export function buildArticleSchema(
  article: BlogArticle,
  config: SiteConfig,
  baseUrl: string
): JsonLD {
  const authorName =
    article.authorMeta?.name ?? article.author ?? config.name ?? 'Equipe SystemForge';
  const authorUrl = article.authorMeta?.url ?? 'https://systemforge.com.br/sobre';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl,
    },
    datePublished: article.date,
    dateModified: article.dateModified ?? article.date,
    publisher: {
      '@type': 'Organization',
      name: config.name,
      logo: `${baseUrl}/brand/sf-logo.webp`,
    },
  };
}

export function buildBreadcrumbList(
  baseUrl: string,
  items: Array<{ name: string; url: string }>,
): JsonLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${baseUrl.replace(/\/$/, '')}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
    })),
  };
}

export function buildProductSchema(config: SiteConfig, baseUrl: string): JsonLD {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.name,
    description: config.seo.description,
    url: baseUrl,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      availability: 'https://schema.org/PreOrder',
    },
  };
}

/** Gera todos os schemas declarados em config.schema[] */
export function buildSchemasForSite(
  config: SiteConfig,
  baseUrl: string,
  extras?: {
    faqs?: Array<{ question: string; answer: string }>;
    howToSteps?: Array<{ title: string; desc: string }>;
    article?: BlogArticle;
  }
): JsonLD[] {
  return config.schema
    .map((type: SchemaType) => {
      switch (type) {
        case 'Organization':
          return buildOrganizationSchema(config, baseUrl);
        case 'FAQPage':
          return buildFAQSchema(extras?.faqs ?? []);
        case 'HowTo':
          return buildHowToSchema(extras?.howToSteps ?? [], config);
        case 'LocalBusiness':
          return buildLocalBusinessSchema(config, baseUrl);
        case 'Article':
          if (!extras?.article) {
            console.warn('[WARN BUILD_055] Schema Article requer extras.article, ignorado.');
            return null;
          }
          return buildArticleSchema(extras.article, config, baseUrl);
        case 'Product':
          return buildProductSchema(config, baseUrl);
        default: {
          // BUILD_055 — schema type não suportado (warning, não fatal)
          console.warn(`[WARN BUILD_055] Schema type '${type}' não suportado, ignorado.`);
          return null;
        }
      }
    })
    .filter((s): s is JsonLD => s !== null);
}
