#!/usr/bin/env tsx
// scripts/patch-blog-frontmatter.ts
// Fonte: TASK-6 intake-review (CL-366) — E-E-A-T.
// Adiciona dateModified (= date) e authorMeta (Person) em todos os
// sites/*/blog/articles/*.md que nao possuam esses campos. Idempotente.
//
// Uso:
//   pnpm tsx scripts/patch-blog-frontmatter.ts            (dry-run)
//   pnpm tsx scripts/patch-blog-frontmatter.ts --write    (aplica)

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const SITES_DIR = join(process.cwd(), 'sites');
const WRITE = process.argv.includes('--write');
const AUTHOR_NAME = 'Equipe SystemForge';
const AUTHOR_URL = 'https://systemforge.com.br/sobre';

interface Result {
  file: string;
  patched: boolean;
  added: string[];
}

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string') return value;
  return undefined;
}

function patchFile(filePath: string): Result {
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);
  const fm = { ...parsed.data };
  const added: string[] = [];

  const date = normalizeDate(fm.date);
  if (!fm.dateModified && date) {
    fm.dateModified = date;
    added.push('dateModified');
  }

  if (!fm.authorMeta) {
    fm.authorMeta = { name: AUTHOR_NAME, url: AUTHOR_URL };
    added.push('authorMeta');
  }

  if (added.length === 0) {
    return { file: filePath, patched: false, added };
  }

  const rebuilt = matter.stringify(parsed.content, fm);
  if (WRITE) writeFileSync(filePath, rebuilt, 'utf-8');

  return { file: filePath, patched: true, added };
}

function walkBlog(): string[] {
  const files: string[] = [];
  if (!existsSync(SITES_DIR)) return files;

  for (const site of readdirSync(SITES_DIR)) {
    if (site.startsWith('_')) continue;
    const articlesDir = join(SITES_DIR, site, 'blog', 'articles');
    if (!existsSync(articlesDir) || !statSync(articlesDir).isDirectory()) continue;
    for (const f of readdirSync(articlesDir)) {
      if (f.endsWith('.md')) files.push(join(articlesDir, f));
    }
  }
  return files;
}

function main(): void {
  const files = walkBlog();
  const results = files.map(patchFile);
  const changed = results.filter((r) => r.patched);

  console.log(`[patch-blog] ${files.length} artigos inspecionados`);
  console.log(`[patch-blog] ${changed.length} artigos ${WRITE ? 'modificados' : 'precisam de patch'}`);

  if (!WRITE && changed.length > 0) {
    console.log('[patch-blog] dry-run — rode novamente com --write para aplicar');
  }

  for (const r of changed) {
    console.log(`  ${r.file}: +${r.added.join(', +')}`);
  }
}

main();
