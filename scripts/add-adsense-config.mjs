#!/usr/bin/env node
/**
 * ADS-24 — Bulk-update dos 36 sites/{slug}/config.json com bloco adsense minimo.
 *
 * Schema (DEC-03):
 *   adsense: { enabled: true, slots: {}, routesAllowed: [] }
 *
 * Idempotente: se config.adsense ja existe, pula. clientId/testMode NAO entram
 * (vivem em env, INV-ADS-05).
 *
 * Uso:
 *   node scripts/add-adsense-config.mjs --dry-run   # lista o que seria mudado
 *   node scripts/add-adsense-config.mjs              # aplica
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');
const SITES_DIR = path.join(ROOT, 'sites');
const DRY = process.argv.includes('--dry-run');

if (!fs.existsSync(SITES_DIR)) {
  console.error(`[adsense-config] sites/ nao encontrado em ${SITES_DIR}`);
  process.exit(1);
}

const slugs = fs.readdirSync(SITES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
  .map((d) => d.name);

let touched = 0;
let skipped = 0;
const skippedSlugs = [];

for (const slug of slugs) {
  const file = path.join(SITES_DIR, slug, 'config.json');
  if (!fs.existsSync(file)) {
    console.warn(`[adsense-config] ${slug}: sem config.json (pulando)`);
    continue;
  }
  const raw = fs.readFileSync(file, 'utf8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    console.error(`[adsense-config] ${slug}: JSON invalido (${e.message})`);
    process.exit(1);
  }

  if (config.adsense !== undefined) {
    skipped++;
    skippedSlugs.push(slug);
    continue;
  }

  config.adsense = {
    enabled: true,
    slots: {},
    routesAllowed: [],
  };

  if (DRY) {
    console.log(`[adsense-config] [DRY] ${slug}: + adsense block`);
  } else {
    // 2-space indent + trailing newline (segue padrao do repo).
    fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n', 'utf8');
    console.log(`[adsense-config] ${slug}: + adsense block`);
  }
  touched++;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`[adsense-config] ${DRY ? '[DRY] ' : ''}touched=${touched} skipped(ja-tem)=${skipped} total=${slugs.length}`);
if (skipped > 0) {
  console.log(`[adsense-config] skipped: ${skippedSlugs.join(', ')}`);
}
