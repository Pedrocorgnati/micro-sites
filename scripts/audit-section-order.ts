/**
 * audit-section-order.ts
 *
 * Valida que a ordem de secoes por categoria esta corretamente definida em
 * `src/lib/section-order.ts` e invariantes por categoria sao respeitados:
 *
 * - Cat B: Solution deve vir ANTES de Problem (CL-197, TASK-4).
 * - Cat D: Calculator deve estar na seccao 2 (index 1) (CL-173).
 *
 * Executa `assertCategoryInvariants(category)` para cada site em sites/*,
 * verificando tambem que `getSectionOrder(category)` corresponde a ordem
 * canonica declarada.
 *
 * Uso:
 *   npx tsx scripts/audit-section-order.ts
 *   npx tsx scripts/audit-section-order.ts --slug=b01-sem-site-profissional
 *
 * Exit codes: 0 OK; 1 violacoes encontradas.
 */

import fs from 'fs';
import path from 'path';
import {
  SECTION_ORDER_BY_CATEGORY,
  assertCategoryInvariants,
  getSectionOrder,
  type Category,
} from '../src/lib/section-order';

const SITES_ROOT = path.join(process.cwd(), 'sites');

interface SiteCheck {
  slug: string;
  category: string;
  ok: boolean;
  errors: string[];
}

function loadSiteCategory(slug: string): string | null {
  const cfgPath = path.join(SITES_ROOT, slug, 'config.json');
  if (!fs.existsSync(cfgPath)) return null;
  try {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as { category?: string };
    return cfg.category ?? null;
  } catch {
    return null;
  }
}

function validateSite(slug: string): SiteCheck {
  const errors: string[] = [];
  const category = loadSiteCategory(slug);

  if (!category) {
    return { slug, category: '?', ok: false, errors: ['config.json ausente ou sem `category`'] };
  }

  const catUpper = category.toUpperCase() as Category;
  if (!(catUpper in SECTION_ORDER_BY_CATEGORY)) {
    return { slug, category, ok: false, errors: [`Categoria desconhecida: ${category}`] };
  }

  const order = getSectionOrder(catUpper);

  // Invariantes por categoria
  try {
    assertCategoryInvariants(catUpper);
  } catch (e) {
    errors.push((e as Error).message);
  }

  // Cat B reforco explicito
  if (catUpper === 'B') {
    const solIdx = order.indexOf('solution');
    const probIdx = order.indexOf('problem');
    if (solIdx < 0 || probIdx < 0) {
      errors.push(`Cat B: solution/problem ausentes na ordem`);
    } else if (solIdx > probIdx) {
      errors.push(
        `Cat B (${slug}): solution@${solIdx} vem DEPOIS de problem@${probIdx} — invalido`,
      );
    }
  }

  // Cat D reforco explicito
  if (catUpper === 'D') {
    const calcIdx = order.indexOf('calculator');
    if (calcIdx !== 1) {
      errors.push(`Cat D (${slug}): calculator@${calcIdx} — esperado idx=1 (seccao 2)`);
    }
  }

  return { slug, category: catUpper, ok: errors.length === 0, errors };
}

function main(): void {
  const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1];

  if (!fs.existsSync(SITES_ROOT)) {
    console.error('sites/ nao encontrado');
    process.exit(1);
  }

  const slugs = slugArg
    ? [slugArg]
    : fs
        .readdirSync(SITES_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
        .map((d) => d.name);

  const reports = slugs.map(validateSite);
  let errors = 0;

  console.log('━'.repeat(60));
  console.log('AUDIT SECTION ORDER — por categoria');
  console.log('━'.repeat(60));

  for (const r of reports) {
    if (r.ok) {
      console.log(`  OK  ${r.slug} [${r.category}]`);
    } else {
      errors += r.errors.length;
      console.log(`  FAIL ${r.slug} [${r.category}]`);
      for (const e of r.errors) console.log(`       - ${e}`);
    }
  }

  console.log('━'.repeat(60));
  console.log(`Total: ${reports.length} sites | OK: ${reports.length - reports.filter((r) => !r.ok).length} | FAIL: ${reports.filter((r) => !r.ok).length} (${errors} violacoes)`);

  process.exit(errors > 0 ? 1 : 0);
}

main();
