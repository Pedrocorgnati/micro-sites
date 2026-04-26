#!/usr/bin/env tsx
/**
 * Audit de atribuicao de wave por site.
 *
 * Fonte canonica (docs/LAUNCH-WAVES.md + INTAKE-REVIEW):
 *   Onda 1 (12): d01, d02, d03, c01, c02, c05, b01, b03, a01, a02, a04, f01
 *   Onda 2 (12): d04, d05, c03, c04, c06, b02, b04, b05, a03, a05, a06, e01
 *   Onda 3 (12): c07, c08, b06, b07, b08, a07, a08, a09, a10, e02, e03, f02
 *
 * Uso:
 *   tsx scripts/audit-waves.ts          # valida; exit 1 se divergente
 *   tsx scripts/audit-waves.ts --fix    # sobrescreve wave no config.json
 */

import fs from 'node:fs';
import path from 'node:path';

const ONDA_1 = ['d01', 'd02', 'd03', 'c01', 'c02', 'c05', 'b01', 'b03', 'a01', 'a02', 'a04', 'f01'];
const ONDA_2 = ['d04', 'd05', 'c03', 'c04', 'c06', 'b02', 'b04', 'b05', 'a03', 'a05', 'a06', 'e01'];
const ONDA_3 = ['c07', 'c08', 'b06', 'b07', 'b08', 'a07', 'a08', 'a09', 'a10', 'e02', 'e03', 'f02'];

function expectedWave(slug: string): 1 | 2 | 3 | null {
  const base = slug.split('-')[0];
  if (ONDA_1.includes(base)) return 1;
  if (ONDA_2.includes(base)) return 2;
  if (ONDA_3.includes(base)) return 3;
  return null;
}

const SITES_ROOT = path.join(process.cwd(), 'sites');
const fix = process.argv.includes('--fix');

const dirs = fs
  .readdirSync(SITES_ROOT)
  .filter((d) => !d.startsWith('_'))
  .filter((d) => fs.statSync(path.join(SITES_ROOT, d)).isDirectory())
  .sort();

let divergent = 0;
let fixed = 0;

for (const slug of dirs) {
  const configPath = path.join(SITES_ROOT, slug, 'config.json');
  if (!fs.existsSync(configPath)) continue;

  const raw = fs.readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(raw);
  const expected = expectedWave(slug);

  if (expected === null) {
    console.warn(`[audit-waves] SKIP ${slug} — fora do mapa canonico`);
    continue;
  }

  if (cfg.wave === expected) {
    console.log(`  OK  ${slug}: wave=${expected}`);
    continue;
  }

  divergent++;
  if (fix) {
    cfg.wave = expected;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + '\n');
    fixed++;
    console.log(`  FIX ${slug}: ${cfg.wave} (era diferente) → ${expected}`);
  } else {
    console.error(`  FAIL ${slug}: wave=${cfg.wave}, esperado ${expected}`);
  }
}

console.log('');
console.log(`Total: ${dirs.length}, divergentes: ${divergent}, corrigidos: ${fixed}`);

if (divergent > 0 && !fix) {
  console.error('Rode com --fix para aplicar.');
  process.exit(1);
}
process.exit(0);
