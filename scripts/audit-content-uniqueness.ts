#!/usr/bin/env tsx
/**
 * Audit de unicidade de conteudo (CL-098) — HCU anti-duplicacao.
 * Detecta paragrafos com shingle-similarity alta (N-grama 7) entre
 * pares de sites distintos. Falha o build se similaridade > LIMIT.
 *
 * Override por linha/arquivo: adicionar `// audit-ok: uniqueness` no paragrafo.
 */
import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE = process.cwd();
const SITES_DIR = path.join(WORKSPACE, 'sites');
const BLOG_DIR = path.join(WORKSPACE, 'src/content/blog');
const N = 7;
const LIMIT = 0.85;
const MIN_WORDS = 30;

type Paragraph = { site: string; file: string; text: string };

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(md|mdx|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function extractParagraphs(file: string, site: string): Paragraph[] {
  const raw = fs.readFileSync(file, 'utf8');
  if (raw.includes('audit-ok: uniqueness')) return [];
  if (file.endsWith('.json')) {
    try {
      const texts: string[] = [];
      const walkJson = (v: unknown): void => {
        if (typeof v === 'string' && v.split(/\s+/).length >= MIN_WORDS) texts.push(v);
        else if (Array.isArray(v)) v.forEach(walkJson);
        else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach(walkJson);
      };
      walkJson(JSON.parse(raw));
      return texts.map(t => ({ site, file, text: t }));
    } catch { return []; }
  }
  return raw
    .split(/\n{2,}/)
    .map(p => p.replace(/^#+\s.*$/gm, '').replace(/[*_`>]/g, '').trim())
    .filter(p => p.split(/\s+/).length >= MIN_WORDS)
    .map(text => ({ site, file, text }));
}

function shingles(text: string, n = N): Set<string> {
  const tokens = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) set.add(tokens.slice(i, i + n).join(' '));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

function main(): void {
  const paragraphs: Paragraph[] = [];
  if (fs.existsSync(SITES_DIR)) {
    for (const site of fs.readdirSync(SITES_DIR)) {
      if (site.startsWith('_')) continue;
      const contentDir = path.join(SITES_DIR, site);
      for (const f of walk(contentDir)) paragraphs.push(...extractParagraphs(f, site));
    }
  }
  for (const f of walk(BLOG_DIR)) {
    const site = path.relative(BLOG_DIR, f).split(path.sep)[0] ?? 'blog';
    paragraphs.push(...extractParagraphs(f, `blog:${site}`));
  }

  const shingled = paragraphs.map(p => ({ ...p, sh: shingles(p.text) }));
  const violations: Array<{ a: Paragraph; b: Paragraph; sim: number }> = [];
  for (let i = 0; i < shingled.length; i++) {
    for (let j = i + 1; j < shingled.length; j++) {
      if (shingled[i].site === shingled[j].site) continue;
      const sim = jaccard(shingled[i].sh, shingled[j].sh);
      if (sim > LIMIT) violations.push({ a: shingled[i], b: shingled[j], sim });
    }
  }

  if (violations.length === 0) {
    console.log(`[audit-content-uniqueness] PASS — ${paragraphs.length} paragrafos, 0 violacoes (limit ${LIMIT})`);
    process.exit(0);
  }
  console.error(`[audit-content-uniqueness] FAIL — ${violations.length} paragrafos duplicados (limit ${LIMIT}):`);
  for (const v of violations.slice(0, 20)) {
    console.error(`  sim=${v.sim.toFixed(3)} ${v.a.site} <-> ${v.b.site}`);
    console.error(`    ${v.a.file}`);
    console.error(`    ${v.b.file}`);
    console.error(`    "${v.a.text.slice(0, 120).replace(/\n/g, ' ')}..."`);
  }
  process.exit(1);
}

main();
