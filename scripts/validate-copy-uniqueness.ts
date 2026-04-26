#!/usr/bin/env tsx
/**
 * validate-copy-uniqueness — anti-HCU (Highly Copied User content).
 *
 * Carrega todos `sites/*\/content/**\/*.md` e calcula similaridade de
 * 5-shingles entre pares de arquivos. Falha se qualquer par ultrapassa
 * 30% de sobreposicao em um paragrafo (bloco de texto entre linhas em branco).
 *
 * Uso:
 *   npm run validate:copy-uniqueness
 *   tsx scripts/validate-copy-uniqueness.ts --threshold 0.3
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITES = path.join(ROOT, 'sites');

const argThreshold = process.argv.indexOf('--threshold');
const THRESHOLD = argThreshold > -1 ? parseFloat(process.argv[argThreshold + 1]) : 0.3;
const SHINGLE = 5;

type Block = { site: string; file: string; idx: number; shingles: Set<string>; sample: string };

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(tokens: string[], n = SHINGLE): Set<string> {
  const set = new Set<string>();
  if (tokens.length < n) return set;
  for (let i = 0; i <= tokens.length - n; i++) set.add(tokens.slice(i, i + n).join(' '));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const blocks: Block[] = [];
const siteDirs = fs.readdirSync(SITES).filter((d) => !d.startsWith('_'));

for (const site of siteDirs) {
  const files = walk(path.join(SITES, site, 'content'));
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8').replace(/^---[\s\S]*?---/, '');
    const paragraphs = raw.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 80);
    paragraphs.forEach((p, idx) => {
      const sh = shingles(tokenize(p));
      if (sh.size >= 3) blocks.push({ site, file: path.relative(ROOT, file), idx, shingles: sh, sample: p.slice(0, 80) });
    });
  }
}

console.log(`[copy-uniqueness] carregou ${blocks.length} paragrafos de ${siteDirs.length} sites`);

const violations: { a: Block; b: Block; sim: number }[] = [];
for (let i = 0; i < blocks.length; i++) {
  for (let j = i + 1; j < blocks.length; j++) {
    if (blocks[i].site === blocks[j].site) continue;
    const sim = jaccard(blocks[i].shingles, blocks[j].shingles);
    if (sim >= THRESHOLD) violations.push({ a: blocks[i], b: blocks[j], sim });
  }
}

if (violations.length === 0) {
  console.log(`[copy-uniqueness] OK — nenhum par >= ${THRESHOLD * 100}% similaridade`);
  process.exit(0);
}

console.error(`[copy-uniqueness] FAIL — ${violations.length} violacoes`);
for (const v of violations.slice(0, 20)) {
  console.error(`  ${(v.sim * 100).toFixed(1)}%  ${v.a.site}:${v.a.file}#${v.a.idx}`);
  console.error(`            ${v.b.site}:${v.b.file}#${v.b.idx}`);
  console.error(`            "${v.a.sample}..."`);
}
if (violations.length > 20) console.error(`  ... +${violations.length - 20} violacoes`);
process.exit(1);
