/**
 * validate-rss.ts
 * Fonte: TASK-3 intake-review (CL-335)
 * Valida que cada site com blog tem um /rss.xml bem formado no dist/.
 * Sem dependencia externa: parser regex minimo (shape check).
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const SITES_DIR = path.join(process.cwd(), 'sites');

interface ValidationResult {
  valid: number;
  errors: { site: string; reason: string }[];
}

function sitesWithBlog(): string[] {
  if (!fs.existsSync(SITES_DIR)) return [];
  return fs.readdirSync(SITES_DIR).filter((slug) => {
    const cfg = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfg)) return false;
    try {
      const data = JSON.parse(fs.readFileSync(cfg, 'utf-8')) as { hasBlog?: boolean };
      return data.hasBlog === true;
    } catch {
      return false;
    }
  });
}

function validateXml(xml: string): string | null {
  if (!xml.startsWith('<?xml')) return 'prologo XML ausente';
  if (!/<rss[\s>]/.test(xml)) return 'elemento <rss> ausente';
  if (!/<channel>/.test(xml)) return '<channel> ausente';
  if (!/<title>/.test(xml)) return '<title> ausente';
  if (!/<link>/.test(xml)) return '<link> ausente';
  if (!/<description>/.test(xml)) return '<description> ausente';
  if (!/<lastBuildDate>/.test(xml)) return '<lastBuildDate> ausente';
  return null;
}

export function validateAllFeeds(): ValidationResult {
  const result: ValidationResult = { valid: 0, errors: [] };
  const sites = sitesWithBlog();

  for (const slug of sites) {
    const feedPath = path.join(DIST, slug, 'rss.xml', 'index.html');
    const altPath = path.join(DIST, slug, 'rss.xml');

    let xml: string | null = null;
    if (fs.existsSync(feedPath)) xml = fs.readFileSync(feedPath, 'utf-8');
    else if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) xml = fs.readFileSync(altPath, 'utf-8');

    if (!xml) {
      result.errors.push({ site: slug, reason: 'rss.xml nao encontrado no dist' });
      continue;
    }

    const err = validateXml(xml);
    if (err) {
      result.errors.push({ site: slug, reason: err });
    } else {
      result.valid += 1;
    }
  }

  return result;
}

function main() {
  const r = validateAllFeeds();
  console.log(`RSS feeds validos: ${r.valid}`);
  if (r.errors.length > 0) {
    console.error('\nErros:');
    for (const e of r.errors) console.error(`  ${e.site}: ${e.reason}`);
    process.exit(1);
  }
  console.log('OK');
  process.exit(0);
}

// Executar apenas quando invocado diretamente
const isDirect = typeof require !== 'undefined'
  ? require.main === module
  : import.meta.url === `file://${process.argv[1]}`;

if (isDirect) main();
