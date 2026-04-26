#!/usr/bin/env tsx
// scripts/migrate-header-variant.ts
// Fonte: TASK-4 intake-review (CL-148, CL-149, CL-150) — ST003
// Script one-shot idempotente: garante que cada sites/{slug}/config.json
// tenha `category` coerente com o prefixo do slug (a01..=A, b..=B, c..=C, etc).
// Nao sobrescreve categorias validas ja definidas — apenas loga divergencias.
// Uso: pnpm tsx scripts/migrate-header-variant.ts [--fix]

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITES_DIR = join(process.cwd(), 'sites');
const FIX = process.argv.includes('--fix');
const VALID = new Set(['A', 'B', 'C', 'D', 'E', 'F']);

function inferCategoryFromSlug(slug: string): string | null {
  const m = slug.match(/^([a-f])\d/i);
  if (!m) return null;
  return m[1].toUpperCase();
}

function main(): void {
  if (!existsSync(SITES_DIR)) {
    console.error(`[migrate-header] diretorio nao encontrado: ${SITES_DIR}`);
    process.exit(1);
  }

  const entries = readdirSync(SITES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'));

  let changed = 0;
  let divergent = 0;
  let ok = 0;

  for (const entry of entries) {
    const configPath = join(SITES_DIR, entry.name, 'config.json');
    if (!existsSync(configPath)) continue;

    const raw = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw) as Record<string, unknown>;
    const inferred = inferCategoryFromSlug(entry.name);
    const current = typeof config.category === 'string' ? config.category : undefined;

    if (!inferred) {
      console.warn(`[migrate-header] ${entry.name}: slug nao bate regex [a-f]\\d — ignorado`);
      continue;
    }

    if (!current || !VALID.has(current)) {
      if (FIX) {
        config.category = inferred;
        writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
        console.log(`[migrate-header] ${entry.name}: category -> ${inferred} (aplicado)`);
        changed++;
      } else {
        console.log(`[migrate-header] ${entry.name}: category ausente (esperado ${inferred}) — use --fix`);
        divergent++;
      }
      continue;
    }

    if (current !== inferred) {
      console.warn(
        `[migrate-header] ${entry.name}: category="${current}" difere do slug ("${inferred}") — verificar manualmente`,
      );
      divergent++;
      continue;
    }

    ok++;
  }

  console.log(
    `[migrate-header] resultado: ok=${ok} changed=${changed} divergent=${divergent} total=${entries.length}`,
  );
  if (divergent > 0 && !FIX) process.exit(1);
}

main();
