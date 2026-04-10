// src/lib/sitemap-generator.ts
import type { SiteConfig } from '@/types';
import { PAGE_ROUTES } from '@/types';

export function generateSitemap(
  config: SiteConfig,
  baseUrl: string,
  extraPaths: string[] = []
): string {
  const staticRoutes = [
    PAGE_ROUTES.home,
    PAGE_ROUTES.contact,
    PAGE_ROUTES.thanks,
    PAGE_ROUTES.privacy,
  ];

  const conditionalRoutes: string[] = [];

  if (['A', 'B', 'C', 'D', 'F'].includes(config.category)) {
    conditionalRoutes.push(PAGE_ROUTES.faq);
  }
  if (config.category === 'D') {
    conditionalRoutes.push('/quanto-custa/');
    if (config.leadMagnet?.enabled) {
      conditionalRoutes.push(PAGE_ROUTES.result);
    }
  }
  if (config.category === 'E') {
    conditionalRoutes.push(PAGE_ROUTES.waitlist);
  }
  if (config.hasBlog) {
    conditionalRoutes.push(PAGE_ROUTES.blog);
  }

  const allPaths = [...staticRoutes, ...conditionalRoutes, ...extraPaths];

  const urls = allPaths
    .map(
      (p) => `
  <url>
    <loc>${baseUrl}${p}</loc>
    <changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`;
}

export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;
}
