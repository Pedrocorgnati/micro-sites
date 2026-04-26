#!/usr/bin/env tsx
/**
 * validate-geo-content — linter de regras GEO para conteudo dos sites.
 *
 * Regras (CL-067/CL-069/CL-070):
 *   R1: Hero/intro responde a pergunta-keyword nos primeiros 200 palavras
 *       (heuristica: >=1 keyword do SEO aparece nos 3 primeiros paragrafos)
 *   R2: Paragrafos devem ter no maximo 3 frases
 *   R3: Paginas ancoras (hero.md, about.md) devem conter pelo menos 1 lista
 *       (linhas comecando com `-` ou `1.`) ou ter features/stats em content/
 *
 * Output: lista de warnings. Exit 0 sempre (informative-only por ora).
 * Forca erro com --strict.
 */

import fs from 'node:fs';
import path from 'node:path';

const STRICT = process.argv.includes('--strict');
const SITES = path.join(process.cwd(), 'sites');

type Warn = { site: string; rule: string; detail: string };
const warns: Warn[] = [];

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function first200(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, 200).map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
}

const dirs = fs
  .readdirSync(SITES)
  .filter((d) => !d.startsWith('_'))
  .filter((d) => fs.statSync(path.join(SITES, d)).isDirectory());

for (const slug of dirs) {
  const configPath = path.join(SITES, slug, 'config.json');
  if (!fs.existsSync(configPath)) continue;
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const keywords: string[] = (cfg.seo?.keywords ?? []).map((k: string) => k.toLowerCase());

  const contentDir = path.join(SITES, slug, 'content');
  if (!fs.existsSync(contentDir)) continue;
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.md'));

  for (const f of files) {
    const full = path.join(contentDir, f);
    const raw = fs.readFileSync(full, 'utf8').replace(/^---[\s\S]*?---/, '');
    const paragraphs = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    // R1: hero/intro 200-word
    if (/^(hero|intro|index)\.md$/.test(f) && keywords.length > 0) {
      const body = paragraphs.slice(0, 3).join(' ');
      const words = first200(body).join(' ');
      const matched = keywords.some((k) => k && words.includes(k.split(' ')[0]));
      if (!matched) {
        warns.push({ site: slug, rule: 'R1', detail: `${f}: nenhuma keyword em primeiros 200 words` });
      }
    }

    // R2: paragrafos > 3 frases
    paragraphs.forEach((p, i) => {
      if (sentences(p).length > 3) {
        warns.push({ site: slug, rule: 'R2', detail: `${f}#${i}: ${sentences(p).length} frases` });
      }
    });

    // R3: listas em hero.md/about.md
    if (/^(hero|about)\.md$/.test(f)) {
      const hasList = /^\s*(-|\d+\.)\s+/m.test(raw);
      if (!hasList) {
        warns.push({ site: slug, rule: 'R3', detail: `${f}: sem lista (- ou 1.)` });
      }
    }
  }
}

if (warns.length === 0) {
  console.log('[geo-content] OK — nenhuma violacao');
  process.exit(0);
}

console.log(`[geo-content] ${warns.length} warnings`);
for (const w of warns.slice(0, 50)) console.log(`  ${w.rule} ${w.site} — ${w.detail}`);
if (warns.length > 50) console.log(`  ... +${warns.length - 50} warnings`);

process.exit(STRICT ? 1 : 0);
