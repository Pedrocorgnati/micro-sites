#!/usr/bin/env tsx
// scripts/seed-site-stats.ts
// Fonte: TASK-7 intake-review (CL-083).
// Para cada site em sites/<slug>/config.json, se nao existir
// sites/<slug>/content/stats.json, copia o template da categoria
// (sites/_templates/stats-<category>.json). Idempotente.
//
// Uso:
//   pnpm tsx scripts/seed-site-stats.ts            (dry-run)
//   pnpm tsx scripts/seed-site-stats.ts --write    (aplica)

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SITES_DIR = join(process.cwd(), 'sites');
const TEMPLATES_DIR = join(SITES_DIR, '_templates');
const WRITE = process.argv.includes('--write');

interface Result {
  slug: string;
  status: 'seeded' | 'skipped-exists' | 'skipped-no-template' | 'error';
  detail?: string;
}

function main(): void {
  const results: Result[] = [];

  for (const entry of readdirSync(SITES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const slug = entry.name;
    const configPath = join(SITES_DIR, slug, 'config.json');
    if (!existsSync(configPath)) continue;

    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as { category?: string };
      if (!config.category) {
        results.push({ slug, status: 'error', detail: 'config sem category' });
        continue;
      }

      const statsPath = join(SITES_DIR, slug, 'content', 'stats.json');
      if (existsSync(statsPath)) {
        results.push({ slug, status: 'skipped-exists' });
        continue;
      }

      const templatePath = join(TEMPLATES_DIR, `stats-${config.category}.json`);
      if (!existsSync(templatePath)) {
        results.push({ slug, status: 'skipped-no-template', detail: config.category });
        continue;
      }

      if (WRITE) {
        const contentDir = join(SITES_DIR, slug, 'content');
        if (!existsSync(contentDir)) mkdirSync(contentDir, { recursive: true });
        writeFileSync(statsPath, readFileSync(templatePath, 'utf-8'), 'utf-8');
      }
      results.push({ slug, status: 'seeded' });
    } catch (err) {
      results.push({ slug, status: 'error', detail: (err as Error).message });
    }
  }

  const seeded = results.filter((r) => r.status === 'seeded');
  const errors = results.filter((r) => r.status === 'error');

  console.log(`[seed-stats] ${results.length} sites inspecionados`);
  console.log(`[seed-stats] ${seeded.length} ${WRITE ? 'seeded' : 'seriam seeded (dry-run)'}`);
  if (errors.length > 0) {
    console.error(`[seed-stats] ${errors.length} erros:`);
    errors.forEach((e) => console.error(`  - ${e.slug}: ${e.detail}`));
    process.exit(1);
  }
}

main();
