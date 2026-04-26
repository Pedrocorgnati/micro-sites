// src/app/rss.xml/route.ts
// Fonte: TASK-3 intake-review (CL-335). Rota estatica servida em build-time.

import fs from 'node:fs';
import path from 'node:path';
import { loadSiteConfig } from '@/lib/config-loader';
import { buildRssFeed, type RssArticle } from '@/lib/rss-generator';

export const dynamic = 'force-static';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';
const SITES_DIR = path.join(process.cwd(), 'sites');

interface IndexedArticle {
  slug: string;
  title: string;
  description?: string;
  date: string;
  author?: string;
}

function readBlogIndex(slug: string): IndexedArticle[] {
  const indexPath = path.join(SITES_DIR, slug, 'blog-index.json');
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as IndexedArticle[];
  } catch {
    return [];
  }
}

export async function GET(): Promise<Response> {
  const config = loadSiteConfig(SITE_SLUG);

  if (!config.hasBlog) {
    return new Response('Not Found', { status: 404 });
  }

  const indexed = readBlogIndex(SITE_SLUG);
  const articles: RssArticle[] = indexed.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description ?? '',
    date: a.date,
    author: a.author ?? 'SystemForge',
  }));

  const baseUrl = (config as unknown as { baseUrl?: string }).baseUrl
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? `https://${SITE_SLUG}.com.br`;

  const xml = buildRssFeed(
    {
      name: config.name,
      description: config.seo.description,
      baseUrl,
      language: 'pt-BR',
    },
    articles,
  );

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
