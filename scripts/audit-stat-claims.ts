#!/usr/bin/env tsx
// scripts/audit-stat-claims.ts
// Fonte: TASK-7 intake-review (CL-083).
// Verifica se valores numericos sensiveis em sites/<slug>/content/homepage.json
// estao referenciando stats.json via placeholder {{stat:<id>}}. Caso contrario,
// lista os trechos candidatos para que o time faca o refactor.
//
// Nao falha o build por padrao (modo relatorio). Use --strict para fail.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITES_DIR = join(process.cwd(), 'sites');
const STRICT = process.argv.includes('--strict');

// casa "70%", "R$ 1200", "R$ 1.200", "30 mil", "12x" dentro de strings JSON
const NUMERIC_CLAIM = /(?:\bR\$[\s\u00A0]*\d[\d.,]*|\b\d[\d.,]*\s?%|\b\d[\d.,]*\s?(?:mil|milhoes|bilhoes|x))/gi;
const PLACEHOLDER = /\{\{stat:[a-z0-9_]+(?::(?:value|text))?\}\}/i;

interface Finding {
  slug: string;
  field: string;
  value: string;
  match: string;
}

function walk(obj: unknown, fieldPath: string, onString: (path: string, value: string) => void): void {
  if (typeof obj === 'string') {
    onString(fieldPath, obj);
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => walk(item, `${fieldPath}[${i}]`, onString));
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) walk(v, fieldPath ? `${fieldPath}.${k}` : k, onString);
  }
}

function main(): void {
  const findings: Finding[] = [];
  let inspected = 0;

  for (const entry of readdirSync(SITES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const contentDir = join(SITES_DIR, entry.name, 'content');
    if (!existsSync(contentDir)) continue;
    const jsonFiles = readdirSync(contentDir).filter(
      (f) => f.endsWith('.json') && f !== 'stats.json' && f !== 'pdf-template.json',
    );
    if (jsonFiles.length === 0) continue;
    inspected++;
    for (const fname of jsonFiles) {
      let data: unknown;
      try {
        data = JSON.parse(readFileSync(join(contentDir, fname), 'utf-8'));
      } catch {
        continue;
      }
      walk(data, fname, (path, value) => {
      if (PLACEHOLDER.test(value)) return;
      const matches = value.match(NUMERIC_CLAIM);
      if (!matches) return;
      for (const m of matches) {
        findings.push({ slug: entry.name, field: path, value, match: m });
      }
    });
    }
  }

  console.log(`[audit-stats] ${inspected} sites inspecionados`);
  console.log(`[audit-stats] ${findings.length} claim(s) numerico(s) sem placeholder {{stat:...}}`);

  if (findings.length > 0) {
    const bySlug = new Map<string, Finding[]>();
    for (const f of findings) {
      const arr = bySlug.get(f.slug) ?? [];
      arr.push(f);
      bySlug.set(f.slug, arr);
    }
    for (const [slug, items] of bySlug) {
      console.log(`\n  ${slug}:`);
      for (const it of items.slice(0, 5)) {
        console.log(`    - ${it.field}: "${it.match}" (em "${it.value.slice(0, 80)}${it.value.length > 80 ? '...' : ''}")`);
      }
      if (items.length > 5) console.log(`    ... +${items.length - 5} outros`);
    }
    if (STRICT) process.exit(1);
  }
}

main();
