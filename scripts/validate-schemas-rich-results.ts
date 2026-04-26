/**
 * Valida JSON-LD em dist/{slug}/**.html via Schema.org-style structural check.
 *
 * Como o Google Rich Results Test API publica nao e estavel/livre, este script
 * faz validacao estrutural local que cobre os erros comuns (missing required
 * fields, tipo invalido, URL malformada). Para validacao 100% Google, rodar
 * manualmente https://search.google.com/test/rich-results em sample.
 *
 * Falha (exit 1) se algum erro estrutural critico em qualquer site.
 *
 * TASK-15 ST002 — gaps CL-109, CL-120
 *
 * Usage:
 *   npx tsx scripts/validate-schemas-rich-results.ts [--site <slug>] [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const REPORTS_DIR = path.resolve('output/reports');
const SITE_FILTER = (() => {
  const i = process.argv.indexOf('--site');
  return i >= 0 ? process.argv[i + 1] : null;
})();
const STRICT = process.argv.includes('--strict');

interface JsonLd {
  '@context'?: string;
  '@type'?: string | string[];
  [key: string]: unknown;
}

interface Issue {
  level: 'error' | 'warning';
  site: string;
  file: string;
  type: string;
  message: string;
}

const REQUIRED_FIELDS: Record<string, string[]> = {
  Organization: ['name', 'url'],
  LocalBusiness: ['name', 'address', 'telephone'],
  Person: ['name'],
  Article: ['headline', 'datePublished', 'author'],
  BlogPosting: ['headline', 'datePublished', 'author'],
  FAQPage: ['mainEntity'],
  WebSite: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
  Service: ['name'],
  Product: ['name'],
};

function walkHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkHtmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function extractJsonLd(html: string): JsonLd[] {
  const matches: JsonLd[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim()) as JsonLd | JsonLd[];
      if (Array.isArray(parsed)) matches.push(...parsed);
      else matches.push(parsed);
    } catch {
      matches.push({ '@type': '__INVALID_JSON__' });
    }
  }
  return matches;
}

function validateSchema(jsonld: JsonLd, site: string, file: string): Issue[] {
  const issues: Issue[] = [];

  if (jsonld['@type'] === '__INVALID_JSON__') {
    issues.push({
      level: 'error',
      site,
      file,
      type: '?',
      message: 'JSON-LD nao parseavel — sintaxe JSON invalida',
    });
    return issues;
  }

  if (!jsonld['@context']) {
    issues.push({ level: 'error', site, file, type: String(jsonld['@type'] ?? '?'), message: '@context ausente' });
  } else if (typeof jsonld['@context'] === 'string' && !jsonld['@context'].includes('schema.org')) {
    issues.push({
      level: 'warning',
      site,
      file,
      type: String(jsonld['@type'] ?? '?'),
      message: `@context inesperado: ${jsonld['@context']}`,
    });
  }

  const types = Array.isArray(jsonld['@type']) ? jsonld['@type'] : [jsonld['@type']];
  for (const t of types) {
    if (!t) continue;
    const required = REQUIRED_FIELDS[String(t)];
    if (!required) continue;
    for (const f of required) {
      if (!(f in jsonld)) {
        issues.push({
          level: 'error',
          site,
          file,
          type: String(t),
          message: `${t} faltando campo obrigatorio: ${f}`,
        });
      }
    }
  }

  // URL validation
  if (typeof jsonld.url === 'string' && !/^https?:\/\//.test(jsonld.url)) {
    issues.push({
      level: 'error',
      site,
      file,
      type: String(jsonld['@type'] ?? '?'),
      message: `url invalida: ${jsonld.url}`,
    });
  }

  return issues;
}

function main(): void {
  if (!fs.existsSync(DIST)) {
    console.warn('[validate-schemas] dist/ nao existe — rodar build antes');
    process.exit(0);
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const slugs = fs
    .readdirSync(DIST, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((s) => !SITE_FILTER || s === SITE_FILTER);

  let allIssues: Issue[] = [];
  let totalSchemas = 0;
  let totalFiles = 0;

  for (const slug of slugs) {
    const files = walkHtmlFiles(path.join(DIST, slug));
    for (const file of files) {
      totalFiles++;
      const html = fs.readFileSync(file, 'utf-8');
      const schemas = extractJsonLd(html);
      totalSchemas += schemas.length;
      for (const s of schemas) {
        allIssues = allIssues.concat(validateSchema(s, slug, path.relative(DIST, file)));
      }
    }
  }

  const errors = allIssues.filter((i) => i.level === 'error');
  const warnings = allIssues.filter((i) => i.level === 'warning');

  const reportFile = path.join(REPORTS_DIR, `schema-validation-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      { totalSites: slugs.length, totalFiles, totalSchemas, errors: errors.length, warnings: warnings.length, issues: allIssues },
      null,
      2,
    ),
  );

  console.log(`[validate-schemas] ${slugs.length} sites, ${totalFiles} HTMLs, ${totalSchemas} JSON-LDs`);
  console.log(`[validate-schemas] errors=${errors.length} warnings=${warnings.length}`);
  console.log(`[validate-schemas] relatorio: ${reportFile}`);

  for (const i of allIssues) {
    const tag = i.level === 'error' ? 'ERROR' : 'WARN ';
    console.log(`  [${tag}] ${i.site}/${i.file} <${i.type}> — ${i.message}`);
  }

  if (errors.length > 0 || (STRICT && warnings.length > 0)) {
    process.exit(1);
  }
}

main();
