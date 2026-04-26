/**
 * Audit SEO metadata across all sites.
 * Checks: canonical absoluto https, title unico, og-image existe (ou fallback og-default).
 * Usage: npx tsx scripts/audit-seo-metadata.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SITES_DIR = path.resolve('sites');
const PUBLIC_DIR = path.resolve('public');
const FALLBACK_OG = path.join(PUBLIC_DIR, 'og-default.png');

interface Issue {
  site: string;
  kind: 'canonical' | 'title' | 'og';
  detail: string;
}

const issues: Issue[] = [];
const titleHash = new Map<string, string[]>();

if (!fs.existsSync(SITES_DIR)) {
  console.warn(`[audit-seo] ${SITES_DIR} nao encontrado`);
  process.exit(0);
}

const siteDirs = fs.readdirSync(SITES_DIR).filter((d) => {
  const full = path.join(SITES_DIR, d);
  return fs.statSync(full).isDirectory() && !d.startsWith('_');
});

for (const slug of siteDirs) {
  const configPath = path.join(SITES_DIR, slug, 'config.json');
  if (!fs.existsSync(configPath)) continue;

  let config: { name?: string; siteUrl?: string; seo?: { title?: string } };
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    issues.push({ site: slug, kind: 'canonical', detail: 'config.json invalido' });
    continue;
  }

  const siteUrl = (config.siteUrl ?? '').trim();
  if (!siteUrl.startsWith('https://')) {
    issues.push({ site: slug, kind: 'canonical', detail: `siteUrl nao https: "${siteUrl}"` });
  }

  const title = config.seo?.title ?? config.name ?? '';
  if (!title) {
    issues.push({ site: slug, kind: 'title', detail: 'title vazio' });
  } else {
    const h = crypto.createHash('md5').update(title).digest('hex');
    const bucket = titleHash.get(h) ?? [];
    bucket.push(slug);
    titleHash.set(h, bucket);
  }

  const ogPath = path.join(SITES_DIR, slug, 'public', 'og-image.png');
  if (!fs.existsSync(ogPath) && !fs.existsSync(FALLBACK_OG)) {
    issues.push({ site: slug, kind: 'og', detail: `og-image ausente e sem fallback` });
  }
}

for (const [hash, sites] of titleHash.entries()) {
  if (sites.length > 1) {
    issues.push({
      site: sites.join(','),
      kind: 'title',
      detail: `title duplicado (hash=${hash.slice(0, 8)}) entre ${sites.length} sites`,
    });
  }
}

if (issues.length === 0) {
  console.log(`[audit-seo] OK — ${siteDirs.length} sites auditados sem issues.`);
  process.exit(0);
}

console.error(`[audit-seo] ${issues.length} issues em ${siteDirs.length} sites:`);
for (const i of issues) console.error(`  [${i.kind}] ${i.site}: ${i.detail}`);
process.exit(1);
