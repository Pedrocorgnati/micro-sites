#!/usr/bin/env tsx
/**
 * blog-inventory-reconcile.ts — TASK-2 ST003 (CL-329)
 *
 * Reconcilia o inventario de artigos por site vs cadencia esperada
 * (docs/blog-pipeline-integration.md secao 3). Gera relatorio em stdout + JSON.
 *
 * Cadencia por categoria:
 *   A: mensal    (1 post/mes)
 *   B: on-demand (se hasBlog true)
 *   C: mensal    (1 post/mes) se hasBlog true
 *   D: bimestral (1 post / 60 dias)
 *   E: n/a       (waitlist)
 *   F: quinzenal (2 post/mes)
 *
 * Exit 1 se qualquer site com hasBlog=true tem deficit > 30 dias.
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

type Category = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const CADENCE_DAYS: Record<Category, number> = {
  A: 30,
  B: 60, // on-demand; usa 60d como teto
  C: 30,
  D: 60,
  E: 9999, // nao aplicavel
  F: 15,
};

type SiteReport = {
  slug: string;
  category: Category;
  hasBlog: boolean;
  postsTotal: number;
  newestPostAgeDays: number | null;
  cadenceDays: number;
  deficitDays: number; // 0 se dentro da cadencia
  status: 'ok' | 'deficit' | 'no-posts' | 'disabled' | 'n/a';
};

const DEFICIT_THRESHOLD_DAYS = 30;
const NOW = Date.now();
const MS_DAY = 86_400_000;

function listSites(root: string): string[] {
  return readdirSync(root)
    .filter((d) => !d.startsWith('_') && !d.startsWith('.'))
    .filter((d) => statSync(join(root, d)).isDirectory());
}

function loadConfig(slug: string): { category: Category; hasBlog: boolean } | null {
  const p = join('sites', slug, 'config.json');
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, 'utf-8'));
    return { category: raw.category as Category, hasBlog: Boolean(raw.hasBlog) };
  } catch {
    return null;
  }
}

function newestPostAge(slug: string): { count: number; ageDays: number | null } {
  const dir = join('sites', slug, 'blog', 'articles');
  if (!existsSync(dir)) return { count: 0, ageDays: null };
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  if (files.length === 0) return { count: 0, ageDays: null };
  let newest = 0;
  for (const f of files) {
    const mtime = statSync(join(dir, f)).mtimeMs;
    if (mtime > newest) newest = mtime;
  }
  const ageDays = Math.floor((NOW - newest) / MS_DAY);
  return { count: files.length, ageDays };
}

const reports: SiteReport[] = [];
for (const slug of listSites('sites')) {
  const cfg = loadConfig(slug);
  if (!cfg) continue;
  const cadence = CADENCE_DAYS[cfg.category] ?? 9999;

  if (!cfg.hasBlog) {
    reports.push({
      slug, category: cfg.category, hasBlog: false,
      postsTotal: 0, newestPostAgeDays: null,
      cadenceDays: cadence, deficitDays: 0, status: 'disabled',
    });
    continue;
  }
  if (cfg.category === 'E') {
    reports.push({
      slug, category: cfg.category, hasBlog: cfg.hasBlog,
      postsTotal: 0, newestPostAgeDays: null,
      cadenceDays: cadence, deficitDays: 0, status: 'n/a',
    });
    continue;
  }

  const { count, ageDays } = newestPostAge(slug);
  let status: SiteReport['status'] = 'ok';
  let deficit = 0;
  if (count === 0) {
    status = 'no-posts';
    deficit = DEFICIT_THRESHOLD_DAYS + 1;
  } else if (ageDays !== null && ageDays > cadence) {
    deficit = ageDays - cadence;
    status = deficit > DEFICIT_THRESHOLD_DAYS ? 'deficit' : 'ok';
  }

  reports.push({
    slug, category: cfg.category, hasBlog: cfg.hasBlog,
    postsTotal: count, newestPostAgeDays: ageDays,
    cadenceDays: cadence, deficitDays: deficit, status,
  });
}

reports.sort((a, b) => (b.deficitDays - a.deficitDays) || a.slug.localeCompare(b.slug));

// Stdout report
console.log('blog-inventory-reconcile — relatorio');
console.log('='.repeat(70));
const header = ['slug', 'cat', 'blog', 'posts', 'age(d)', 'cadence', 'deficit(d)', 'status'];
console.log(header.join('\t'));
for (const r of reports) {
  console.log([
    r.slug,
    r.category,
    r.hasBlog ? 'Y' : 'N',
    r.postsTotal.toString(),
    r.newestPostAgeDays === null ? '-' : r.newestPostAgeDays.toString(),
    r.cadenceDays.toString(),
    r.deficitDays.toString(),
    r.status,
  ].join('\t'));
}

const summary = {
  total: reports.length,
  withBlog: reports.filter((r) => r.hasBlog).length,
  ok: reports.filter((r) => r.status === 'ok').length,
  deficit: reports.filter((r) => r.status === 'deficit').length,
  noPosts: reports.filter((r) => r.status === 'no-posts').length,
  disabled: reports.filter((r) => r.status === 'disabled').length,
  na: reports.filter((r) => r.status === 'n/a').length,
};

console.log('='.repeat(70));
console.log(`Total: ${summary.total} | Blog: ${summary.withBlog} | OK: ${summary.ok} | Deficit: ${summary.deficit} | No-posts: ${summary.noPosts}`);

// JSON report (para CI)
const outDir = 'output';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'blog-inventory-report.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), summary, reports }, null, 2),
);

const failing = reports.filter((r) => r.status === 'deficit' || r.status === 'no-posts');
if (failing.length > 0) {
  console.error(`\n[reconcile] FALHA — ${failing.length} site(s) com deficit > ${DEFICIT_THRESHOLD_DAYS}d`);
  process.exit(1);
}
console.log('\n[reconcile] OK — cadencia em dia');
process.exit(0);
