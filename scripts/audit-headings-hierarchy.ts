#!/usr/bin/env tsx
/**
 * Audit de hierarquia de headings (CL-179).
 * Regras:
 *  - Exatamente 1 <h1> por arquivo de pagina (TSX em src/app) e por MDX blog.
 *  - Sem saltos de nivel (H1 -> H3 sem H2).
 * Override: `// audit-ok: headings` na linha anterior.
 */
import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE = process.cwd();
const APP_DIR = path.join(WORKSPACE, 'src/app');
const BLOG_DIR = path.join(WORKSPACE, 'src/content/blog');

type Violation = { file: string; issue: string };

function walk(dir: string, pattern: RegExp, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, pattern, out);
    else if (pattern.test(entry.name)) out.push(full);
  }
  return out;
}

function extractHeadings(content: string, isMdx: boolean): number[] {
  const levels: number[] = [];
  if (isMdx) {
    const lines = content.split('\n');
    for (const line of lines) {
      const m = line.match(/^(#{1,6})\s+\S/);
      if (m) levels.push(m[1].length);
    }
  }
  const regex = /<h([1-6])\b/gi;
  let m;
  while ((m = regex.exec(content)) !== null) levels.push(parseInt(m[1], 10));
  return levels;
}

function analyze(file: string): Violation[] {
  const raw = fs.readFileSync(file, 'utf8');
  if (raw.includes('audit-ok: headings')) return [];
  const isMdx = /\.mdx?$/.test(file);
  const levels = extractHeadings(raw, isMdx);
  const violations: Violation[] = [];
  const h1Count = levels.filter(l => l === 1).length;
  if (/page\.tsx$/.test(file) || isMdx) {
    if (h1Count === 0) violations.push({ file, issue: 'Sem <h1>' });
    if (h1Count > 1) violations.push({ file, issue: `${h1Count} <h1> (esperado 1)` });
  }
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      violations.push({ file, issue: `Salto de H${levels[i - 1]} para H${levels[i]}` });
    }
  }
  return violations;
}

function main(): void {
  const files = [
    ...walk(APP_DIR, /page\.tsx$/),
    ...walk(BLOG_DIR, /\.mdx?$/),
  ];
  const violations = files.flatMap(analyze);
  if (violations.length === 0) {
    console.log(`[audit-headings-hierarchy] PASS — ${files.length} arquivos analisados`);
    process.exit(0);
  }
  console.error(`[audit-headings-hierarchy] FAIL — ${violations.length} violacoes:`);
  for (const v of violations.slice(0, 30)) {
    console.error(`  ${path.relative(WORKSPACE, v.file)}: ${v.issue}`);
  }
  process.exit(1);
}

main();
