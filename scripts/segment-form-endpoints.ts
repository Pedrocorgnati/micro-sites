/**
 * segment-form-endpoints — aplica convencao de endpoint segmentado por slug+tipo.
 *
 * Convencao: `{slug-prefix}-{tipo}` onde slug-prefix = primeiros chars antes do hifen
 *   - d01 -> "d01-contato", "d01-calc", "d01-waitlist"
 *   - a01 -> "a01-contato"
 *
 * Atualiza sites/{slug}/config.json adicionando bloco `formEndpoints`:
 *   {
 *     "formEndpoints": {
 *       "contact": "{slug}-contato",
 *       "calc": "{slug}-calc",   // apenas se Cat D + leadMagnet
 *       "waitlist": "{slug}-waitlist"  // apenas se Cat E
 *     }
 *   }
 *
 * Pedro precisa CRIAR esses endpoints no SF dashboard. Os identifiers ficam
 * registrados no config; o resolver `getFormEndpoint` mapeia para URL real
 * via env var `STATIC_FORMS_URL_<SLUG>_<TYPE>` em deploy.
 *
 * TASK-20 ST001 — gaps CL-142, CL-492
 *
 * Usage:
 *   npx tsx scripts/segment-form-endpoints.ts [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve('sites');
const DRY_RUN = process.argv.includes('--dry-run');

interface Endpoints {
  contact?: string;
  calc?: string;
  waitlist?: string;
}

function endpointId(slug: string, type: 'contact' | 'calc' | 'waitlist'): string {
  const prefix = slug.split('-')[0];
  const map = { contact: 'contato', calc: 'calc', waitlist: 'waitlist' };
  return `${prefix}-${map[type]}`;
}

function shouldHaveCalc(cfg: { category?: string; leadMagnet?: { enabled?: boolean } }): boolean {
  return cfg.category === 'D' && Boolean(cfg.leadMagnet?.enabled);
}

function shouldHaveWaitlist(cfg: { category?: string }): boolean {
  return cfg.category === 'E';
}

function main(): void {
  if (!fs.existsSync(SITES_DIR)) {
    console.warn('[segment-forms] sites/ nao existe');
    process.exit(0);
  }

  const slugs = fs
    .readdirSync(SITES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name);

  let updated = 0;

  for (const slug of slugs) {
    const cfgPath = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    const raw = fs.readFileSync(cfgPath, 'utf-8');
    const cfg = JSON.parse(raw) as {
      category?: string;
      leadMagnet?: { enabled?: boolean };
      formEndpoints?: Endpoints;
    };

    const endpoints: Endpoints = {
      contact: endpointId(slug, 'contact'),
    };
    if (shouldHaveCalc(cfg)) endpoints.calc = endpointId(slug, 'calc');
    if (shouldHaveWaitlist(cfg)) endpoints.waitlist = endpointId(slug, 'waitlist');

    const before = JSON.stringify(cfg.formEndpoints ?? {});
    const after = JSON.stringify(endpoints);
    if (before === after) {
      console.log(`  ${slug}: ja segmentado, no change`);
      continue;
    }

    (cfg as { formEndpoints?: Endpoints }).formEndpoints = endpoints;
    if (!DRY_RUN) {
      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
    }
    console.log(`  ${slug}: +formEndpoints ${after}${DRY_RUN ? ' (dry-run)' : ''}`);
    updated++;
  }

  console.log(`[segment-forms] OK — ${updated}/${slugs.length} sites atualizados`);
}

main();
