#!/usr/bin/env tsx
/**
 * validate-blog-selectivity — enforce regra de seletividade de blog por categoria.
 *
 * Whitelist (CL-252/CL-253):
 *   A: todos   B: todos   C: {C01, C03, C04, C05, C06}
 *   D: {D01, D02}   E: nenhum   F: todos
 *
 * Falha se algum site fora da whitelist tem `hasBlog: true` em config.json,
 * ou se algum site dentro da whitelist tem `hasBlog: false`.
 */

import fs from 'node:fs';
import path from 'node:path';

const SITES = path.join(process.cwd(), 'sites');

const C_ALLOW = new Set(['c01', 'c03', 'c04', 'c05', 'c06']);
const D_ALLOW = new Set(['d01', 'd02']);

function allowed(cat: string, base: string): boolean {
  const C = cat.toUpperCase();
  if (C === 'A' || C === 'B' || C === 'F') return true;
  if (C === 'E') return false;
  if (C === 'C') return C_ALLOW.has(base);
  if (C === 'D') return D_ALLOW.has(base);
  return false;
}

const dirs = fs
  .readdirSync(SITES)
  .filter((d) => !d.startsWith('_'))
  .filter((d) => fs.statSync(path.join(SITES, d)).isDirectory());

let fails = 0;
for (const slug of dirs) {
  const p = path.join(SITES, slug, 'config.json');
  if (!fs.existsSync(p)) continue;
  const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
  const base = slug.split('-')[0];
  const cat = cfg.category;
  const expected = allowed(cat, base);
  const actual = !!cfg.hasBlog;
  if (expected === actual) {
    console.log(`  OK  ${slug} cat=${cat} hasBlog=${actual}`);
  } else {
    fails++;
    console.error(`  FAIL ${slug} cat=${cat} hasBlog=${actual} (esperado ${expected})`);
  }
}

console.log(`\nTotal: ${dirs.length}, violacoes: ${fails}`);
process.exit(fails > 0 ? 1 : 0);
