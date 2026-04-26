#!/usr/bin/env tsx
// scripts/audit-header-variants.ts
// Fonte: TASK-4 intake-review (CL-148, CL-149, CL-150)
// Valida que cada site/{slug}/config.json tem category no conjunto A-F e
// que HEADER_VARIANT_BY_CATEGORY conhece aquela categoria.
// Uso: pnpm tsx scripts/audit-header-variants.ts  (ou node --import tsx)

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { HEADER_VARIANT_BY_CATEGORY } from '../src/lib/constants';

const SITES_DIR = join(process.cwd(), 'sites');
const VALID_CATEGORIES = Object.keys(HEADER_VARIANT_BY_CATEGORY) as Array<
  keyof typeof HEADER_VARIANT_BY_CATEGORY
>;

interface Issue {
  slug: string;
  reason: string;
}

function main(): void {
  if (!existsSync(SITES_DIR)) {
    console.error(`[audit-header] diretorio nao encontrado: ${SITES_DIR}`);
    process.exit(1);
  }

  const entries = readdirSync(SITES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'));

  const issues: Issue[] = [];
  let audited = 0;

  for (const entry of entries) {
    const configPath = join(SITES_DIR, entry.name, 'config.json');
    if (!existsSync(configPath)) {
      issues.push({ slug: entry.name, reason: 'config.json ausente' });
      continue;
    }

    try {
      const raw = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(raw) as { category?: string };

      if (!config.category) {
        issues.push({ slug: entry.name, reason: 'campo "category" ausente' });
        continue;
      }

      if (!VALID_CATEGORIES.includes(config.category as (typeof VALID_CATEGORIES)[number])) {
        issues.push({
          slug: entry.name,
          reason: `category "${config.category}" nao mapeada em HEADER_VARIANT_BY_CATEGORY`,
        });
        continue;
      }

      audited++;
    } catch (err) {
      issues.push({
        slug: entry.name,
        reason: `falha ao parsear config.json: ${(err as Error).message}`,
      });
    }
  }

  console.log(`[audit-header] ${audited}/${entries.length} sites auditados com sucesso`);

  if (issues.length > 0) {
    console.error(`[audit-header] ${issues.length} problema(s) encontrado(s):`);
    for (const issue of issues) {
      console.error(`  - ${issue.slug}: ${issue.reason}`);
    }
    process.exit(1);
  }

  console.log('[audit-header] OK — todos os sites tem category valida');
}

main();
