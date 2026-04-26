/**
 * reconcile-accent-colors.ts
 * Fonte: TASK-4 intake-review (CL-158..CL-163).
 * Varre sites/{slug}/config.json e reconcilia accentColor com CATEGORY_THEME_COLORS.
 * Default: dry-run. Use `--apply` para sobrescrever.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_THEME_COLORS } from '../src/lib/category-theme';
import type { SiteCategory } from '../src/types';

const SITES_DIR = path.join(process.cwd(), 'sites');
const APPLY = process.argv.includes('--apply');

interface Drift {
  slug: string;
  category: SiteCategory;
  current: string;
  expected: string;
}

function main() {
  if (!fs.existsSync(SITES_DIR)) {
    console.error('sites/ nao encontrado');
    process.exit(1);
  }

  const drifts: Drift[] = [];
  const slugs = fs.readdirSync(SITES_DIR);

  for (const slug of slugs) {
    const cfgPath = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      console.warn(`⚠ ${slug}: config.json invalido`);
      continue;
    }
    const category = parsed.category as SiteCategory | undefined;
    if (!category || !(category in CATEGORY_THEME_COLORS)) continue;
    const current = (parsed.accentColor as string | undefined) ?? '';
    const expected = CATEGORY_THEME_COLORS[category];
    if (current.toLowerCase() !== expected.toLowerCase()) {
      drifts.push({ slug, category, current, expected });
      if (APPLY) {
        parsed.accentColor = expected;
        fs.writeFileSync(cfgPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
      }
    }
  }

  console.log(`Reconcile accent colors (${APPLY ? 'APPLY' : 'dry-run'})`);
  if (drifts.length === 0) {
    console.log('OK: nenhum drift');
    return;
  }
  for (const d of drifts) {
    console.log(`  ${APPLY ? 'FIX' : 'DRIFT'}  ${d.slug} (${d.category}): ${d.current} -> ${d.expected}`);
  }
  if (!APPLY) {
    console.log(`\n${drifts.length} divergencia(s). Rode com --apply para corrigir.`);
    process.exit(1);
  }
}

main();
