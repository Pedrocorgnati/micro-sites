#!/usr/bin/env tsx
/**
 * Auditoria de frontmatter de artigos de blog — report-first (não modifica nada).
 *
 * Gera logs/frontmatter-audit-{ts}.json + .csv com colunas:
 *   site, file, missing_slug, slug_value, title_len, description_len, word_count, issues[]
 *
 * Uso: npm run audit:frontmatter
 * Fonte: TASK-5 ST001 (module-11-blog-pipeline — M8/G-002 remediation)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { BLOG_CONFIG } from '../src/lib/constants';

const SITES_DIR = path.join(process.cwd(), 'sites');
const LOGS_DIR = path.join(process.cwd(), 'logs');

type Row = {
  site: string;
  file: string;
  missing_slug: boolean;
  slug_value: string | null;
  title_len: number;
  description_len: number;
  word_count: number;
  issues: string[];
};

function countWords(body: string): number {
  return body.split(/\s+/).filter((w) => w.length > 0).length;
}

function auditOne(site: string, file: string, filePath: string): Row {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const slug = typeof data.slug === 'string' ? data.slug : null;
  const title = typeof data.title === 'string' ? data.title : '';
  const description = typeof data.description === 'string' ? data.description : '';
  const wordCount = countWords(content);

  const issues: string[] = [];
  if (!slug) issues.push('missing-slug');
  if (title.length === 0) issues.push('missing-title');
  else if (title.length > BLOG_CONFIG.TITLE_MAX_LENGTH) issues.push('title-too-long');
  if (description.length === 0) issues.push('missing-description');
  else if (description.length < 50) issues.push('description-too-short');
  else if (description.length > BLOG_CONFIG.DESCRIPTION_MAX_LENGTH) issues.push('description-too-long');
  if (wordCount < BLOG_CONFIG.MIN_WORD_COUNT) issues.push('word-count-low');

  return {
    site,
    file,
    missing_slug: !slug,
    slug_value: slug,
    title_len: title.length,
    description_len: description.length,
    word_count: wordCount,
    issues,
  };
}

function toCsv(rows: Row[]): string {
  const headers = ['site', 'file', 'missing_slug', 'slug_value', 'title_len', 'description_len', 'word_count', 'issues'];
  const body = rows.map((r) =>
    [
      r.site,
      r.file,
      String(r.missing_slug),
      r.slug_value ?? '',
      r.title_len,
      r.description_len,
      r.word_count,
      r.issues.join('|'),
    ]
      .map((v) => {
        const s = String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(',')
  );
  return [headers.join(','), ...body].join('\n') + '\n';
}

// ========== main ==========

if (!existsSync(SITES_DIR)) {
  console.error(`✗ Diretório sites/ não encontrado em ${SITES_DIR}`);
  process.exit(1);
}
if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });

const rows: Row[] = [];
for (const site of readdirSync(SITES_DIR).sort()) {
  const blogDir = path.join(SITES_DIR, site, 'blog', 'articles');
  if (!existsSync(blogDir)) continue;
  const files = readdirSync(blogDir).filter((f) => f.endsWith('.md')).sort();
  for (const file of files) {
    rows.push(auditOne(site, file, path.join(blogDir, file)));
  }
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const jsonPath = path.join(LOGS_DIR, `frontmatter-audit-${ts}.json`);
const csvPath = path.join(LOGS_DIR, `frontmatter-audit-${ts}.csv`);

writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
writeFileSync(csvPath, toCsv(rows));

// Sumario
const withIssues = rows.filter((r) => r.issues.length > 0);
const byIssue: Record<string, number> = {};
for (const r of rows) {
  for (const i of r.issues) byIssue[i] = (byIssue[i] ?? 0) + 1;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('FRONTMATTER AUDIT — M8/G-002 (TASK-5 ST001)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total artigos:    ${rows.length}`);
console.log(`Com issues:       ${withIssues.length}`);
console.log(`Sem issues:       ${rows.length - withIssues.length}`);
console.log('');
console.log('Por tipo de issue:');
Object.entries(byIssue)
  .sort((a, b) => b[1] - a[1])
  .forEach(([issue, count]) => console.log(`  ${issue.padEnd(28)} ${count}`));
console.log('');
console.log(`Relatorios: ${jsonPath}`);
console.log(`            ${csvPath}`);

process.exit(0);
