// src/lib/rss-generator.ts
// Fonte: TASK-3 intake-review (CL-335) — gerador RSS 2.0 em build-time.

export interface RssArticle {
  slug: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  author?: string;
}

export interface RssSiteInfo {
  name: string;
  description: string;
  baseUrl: string;
  language?: string;
  blogBasePath?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc2822(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

export function buildRssFeed(site: RssSiteInfo, articles: RssArticle[]): string {
  const language = site.language ?? 'pt-BR';
  const blogBase = site.blogBasePath ?? '/blog';
  const baseUrl = site.baseUrl.replace(/\/+$/, '');

  const lastBuildDateSource = articles.length > 0
    ? articles.reduce((acc, a) => (a.date > acc ? a.date : acc), articles[0].date)
    : new Date().toISOString();
  const lastBuildDate = toRfc2822(lastBuildDateSource);

  const items = articles
    .map((article) => {
      const link = `${baseUrl}${blogBase}/${article.slug}`;
      const pubDate = toRfc2822(article.date);
      const author = article.author ?? 'SystemForge';
      return [
        '    <item>',
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <description>${escapeXml(article.description ?? '')}</description>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <author>noreply@systemforge.com.br (${escapeXml(author)})</author>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(site.name)}</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    `    <language>${escapeXml(language)}</language>`,
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(baseUrl + '/rss.xml')}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ].filter(Boolean).join('\n');
}
