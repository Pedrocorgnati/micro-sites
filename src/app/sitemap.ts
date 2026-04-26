import type { MetadataRoute } from 'next';
import { loadSiteConfig, loadBlogArticles } from '@/lib/config-loader';
import { PAGE_ROUTES } from '@/types';
import { BLOG_CONFIG } from '@/lib/constants';

export const dynamic = 'force-static';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = loadSiteConfig(SITE_SLUG);
  const articles = await loadBlogArticles(SITE_SLUG);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}${PAGE_ROUTES.contact}`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}${PAGE_ROUTES.privacy}`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}${PAGE_ROUTES.terms}`, changeFrequency: 'monthly', priority: 0.3 },
    // TASK-18 / CL-234 — pagina dedicada de cookies (LGPD).
    { url: `${BASE_URL}${PAGE_ROUTES.cookies}`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const conditionalRoutes: MetadataRoute.Sitemap = [];

  if (['A', 'B', 'C', 'D', 'F'].includes(config.category)) {
    conditionalRoutes.push({ url: `${BASE_URL}${PAGE_ROUTES.faq}`, changeFrequency: 'monthly', priority: 0.7 });
  }

  if (config.category === 'D') {
    conditionalRoutes.push({ url: `${BASE_URL}/quanto-custa`, changeFrequency: 'monthly', priority: 0.8 });
    conditionalRoutes.push({ url: `${BASE_URL}/diagnostico`, changeFrequency: 'monthly', priority: 0.8 });

    if (config.leadMagnet?.enabled) {
      conditionalRoutes.push({ url: `${BASE_URL}${PAGE_ROUTES.result}`, changeFrequency: 'monthly', priority: 0.6 });
    }

    // CL-364: rota canonica /simulador para D05 (gateada por config.routes.simulador)
    if ((config as { routes?: { simulador?: boolean } }).routes?.simulador) {
      conditionalRoutes.push({ url: `${BASE_URL}/simulador`, changeFrequency: 'monthly', priority: 0.9 });
    }
  }

  if (config.category === 'E') {
    conditionalRoutes.push({ url: `${BASE_URL}${PAGE_ROUTES.waitlist}`, changeFrequency: 'monthly', priority: 0.8 });
  }

  if (config.hasBlog) {
    conditionalRoutes.push({ url: `${BASE_URL}${PAGE_ROUTES.blog}`, changeFrequency: 'weekly', priority: 0.8 });

    // TASK-10 / CL-348: paginas paginadas /blog/page/N (N >= 2)
    const totalPages = Math.ceil(articles.length / BLOG_CONFIG.ARTICLES_PER_PAGE);
    for (let p = 2; p <= totalPages; p++) {
      conditionalRoutes.push({
        url: `${BASE_URL}/blog/page/${p}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }

    for (const article of articles) {
      conditionalRoutes.push({
        url: `${BASE_URL}/blog/${article.slug}`,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return [...staticRoutes, ...conditionalRoutes];
}
