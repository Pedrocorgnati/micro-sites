/**
 * audit-blog-volume — conta artigos blog por categoria vs metas INTAKE.
 *
 * Glob: sites/*\/blog/**\/*.md (e .mdx)
 *
 * Metas (canonicas — ajustar conforme INTAKE):
 *   Cat A: 20-30 artigos
 *   Cat B: 16-24
 *   Cat C: 10-15
 *   Cat D: 4-6
 *   Cat E: 0-2 (waitlist nao precisa volume blog)
 *   Cat F: 6-8
 *
 * Output: output/reports/blog-volume-{YYYY-MM}.md
 *
 * TASK-23 ST002 — gaps CL-353, CL-449-454, CL-448
 *
 * Usage:
 *   npx tsx scripts/audit-blog-volume.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve('sites');
const REPORTS_DIR = path.resolve('output/reports');

const TARGETS: Record<string, { min: number; max: number }> = {
  A: { min: 20, max: 30 },
  B: { min: 16, max: 24 },
  C: { min: 10, max: 15 },
  D: { min: 4, max: 6 },
  E: { min: 0, max: 2 },
  F: { min: 6, max: 8 },
};

interface SiteCount {
  slug: string;
  category: string;
  count: number;
  status: 'below' | 'on-target' | 'above' | 'no-target';
}

function categoryOf(slug: string): string {
  return slug.charAt(0).toUpperCase();
}

function countMd(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countMd(path.join(dir, e.name));
    else if (e.name.endsWith('.md') || e.name.endsWith('.mdx')) {
      // Excluir _index.md / README.md
      if (!/^(_index|README)/.test(e.name)) n++;
    }
  }
  return n;
}

function statusOf(category: string, count: number): SiteCount['status'] {
  const t = TARGETS[category];
  if (!t) return 'no-target';
  if (count < t.min) return 'below';
  if (count > t.max) return 'above';
  return 'on-target';
}

function main(): void {
  if (!fs.existsSync(SITES_DIR)) {
    console.warn('[blog-volume] sites/ nao existe');
    process.exit(0);
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const sites: SiteCount[] = [];
  for (const slug of fs.readdirSync(SITES_DIR)) {
    if (slug.startsWith('_')) continue;
    const blogDir = path.join(SITES_DIR, slug, 'blog');
    const count = countMd(blogDir);
    const category = categoryOf(slug);
    sites.push({ slug, category, count, status: statusOf(category, count) });
  }

  // Por categoria
  const byCategory = new Map<string, SiteCount[]>();
  for (const s of sites) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }

  const total = sites.reduce((acc, s) => acc + s.count, 0);
  const month = new Date().toISOString().slice(0, 7);
  const file = path.join(REPORTS_DIR, `blog-volume-${month}.md`);

  const lines: string[] = [
    `# Blog Volume Audit — ${month}`,
    '',
    `**Sites auditados:** ${sites.length}`,
    `**Total artigos:** ${total}`,
    `**Meta agregada (somando todas categorias):** ${Object.values(TARGETS)
      .reduce((acc, t) => ({ min: acc.min + t.min, max: acc.max + t.max }), { min: 0, max: 0 }).min}-${Object.values(
      TARGETS,
    ).reduce((acc, t) => ({ min: acc.min + t.min, max: acc.max + t.max }), { min: 0, max: 0 }).max}`,
    '',
    '## Por categoria',
    '',
    '| Categoria | Sites | Total | Media/site | Meta/site | Status |',
    '|---|---|---|---|---|---|',
  ];

  for (const [cat, list] of Array.from(byCategory.entries()).sort()) {
    const sum = list.reduce((a, s) => a + s.count, 0);
    const avg = list.length ? Math.round((sum / list.length) * 10) / 10 : 0;
    const t = TARGETS[cat];
    const target = t ? `${t.min}-${t.max}` : 'n/a';
    const status = !t
      ? 'no-target'
      : avg < t.min
      ? 'BELOW'
      : avg > t.max
      ? 'ABOVE'
      : 'OK';
    lines.push(`| ${cat} | ${list.length} | ${sum} | ${avg} | ${target} | ${status} |`);
  }

  lines.push('', '## Por site', '');
  lines.push('| Slug | Categoria | Artigos | Meta | Status |');
  lines.push('|---|---|---|---|---|');
  for (const s of sites.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const t = TARGETS[s.category];
    const target = t ? `${t.min}-${t.max}` : 'n/a';
    lines.push(`| ${s.slug} | ${s.category} | ${s.count} | ${target} | ${s.status} |`);
  }

  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf-8');
  console.log(`[blog-volume] ${file}`);
  console.log(`[blog-volume] total=${total} sites=${sites.length}`);

  // Sumario CLI
  for (const [cat, list] of byCategory) {
    const sum = list.reduce((a, s) => a + s.count, 0);
    const t = TARGETS[cat];
    const target = t ? `${t.min}-${t.max}` : 'n/a';
    console.log(`  Cat ${cat}: ${sum} artigos em ${list.length} sites (meta/site: ${target})`);
  }
}

main();
