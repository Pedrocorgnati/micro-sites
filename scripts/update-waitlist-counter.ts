/**
 * update-waitlist-counter — atualiza waitlist.count em sites/e*/config.json semanalmente.
 *
 * Fonte de verdade: Static Forms API (endpoint por slug). Como SF nao tem GET API estavel,
 * suportamos 3 modos:
 *   --mode=manual   — le `output/reports/waitlist-counts-manual.json` (Pedro preenche)
 *   --mode=sf-api   — usa SF_API_KEY + SF_FORM_ID por slug (se contratado plano Pro)
 *   --mode=local    — conta entries em `logs/waitlist-{slug}.jsonl` (modo dev/preview)
 *
 * TASK-24 ST002 — gap CL-208
 *
 * Usage:
 *   npx tsx scripts/update-waitlist-counter.ts --mode=manual
 *   npx tsx scripts/update-waitlist-counter.ts --mode=sf-api
 */
import fs from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve('sites');
const REPORTS_DIR = path.resolve('output/reports');
const LOGS_DIR = path.resolve('logs');
const MODE = (() => {
  const i = process.argv.indexOf('--mode');
  return (i >= 0 ? process.argv[i + 1] : 'manual') as 'manual' | 'sf-api' | 'local';
})();
const DRY_RUN = process.argv.includes('--dry-run');

function listESites(): string[] {
  if (!fs.existsSync(SITES_DIR)) return [];
  return fs
    .readdirSync(SITES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('e'))
    .map((e) => e.name);
}

function loadManualCounts(): Record<string, number> {
  const file = path.join(REPORTS_DIR, 'waitlist-counts-manual.json');
  if (!fs.existsSync(file)) {
    console.warn(`[wl-counter] arquivo manual ausente: ${file}`);
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, number>;
  } catch {
    console.warn('[wl-counter] manual file corrompido; usando vazio');
    return {};
  }
}

function loadLocalCounts(slug: string): number {
  const file = path.join(LOGS_DIR, `waitlist-${slug}.jsonl`);
  if (!fs.existsSync(file)) return 0;
  const emails = new Set<string>();
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line) as { email?: string };
      if (j.email) emails.add(j.email.toLowerCase().trim());
    } catch {
      /* skip */
    }
  }
  return emails.size;
}

async function fetchSfCount(slug: string): Promise<number> {
  const apiKey = process.env.SF_API_KEY;
  const formId = process.env[`SF_FORM_ID_${slug.toUpperCase().replace(/-/g, '_')}`];
  if (!apiKey || !formId) {
    console.warn(`[wl-counter] SF_API_KEY ou SF_FORM_ID_${slug} ausentes — skip`);
    return -1;
  }
  // Static Forms Pro tem endpoint /api/v1/submissions?formId=...
  const url = `https://api.staticforms.xyz/submissions?formId=${formId}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return -1;
    const data = (await res.json()) as { submissions?: Array<{ data?: { email?: string } }> };
    const emails = new Set<string>();
    for (const s of data.submissions ?? []) {
      const e = s.data?.email;
      if (e) emails.add(e.toLowerCase().trim());
    }
    return emails.size;
  } catch {
    return -1;
  }
}

async function main(): Promise<void> {
  const slugs = listESites();
  if (slugs.length === 0) {
    console.warn('[wl-counter] nenhum site Cat E encontrado');
    process.exit(0);
  }

  console.log(`[wl-counter] mode=${MODE} | sites=${slugs.length}`);

  const manual = MODE === 'manual' ? loadManualCounts() : {};
  let updated = 0;

  for (const slug of slugs) {
    const cfgPath = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as {
      waitlist?: { count?: number };
      [k: string]: unknown;
    };
    let count = -1;
    if (MODE === 'manual') count = manual[slug] ?? -1;
    else if (MODE === 'local') count = loadLocalCounts(slug);
    else count = await fetchSfCount(slug);

    if (count < 0) {
      console.log(`  ${slug}: skip (sem dados)`);
      continue;
    }

    const oldCount = cfg.waitlist?.count ?? 0;
    if (count === oldCount) {
      console.log(`  ${slug}: ${oldCount} (no change)`);
      continue;
    }

    if (!cfg.waitlist) cfg.waitlist = {};
    cfg.waitlist.count = count;

    if (!DRY_RUN) {
      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
    }
    console.log(`  ${slug}: ${oldCount} -> ${count}${DRY_RUN ? ' (dry-run)' : ''}`);
    updated++;
  }

  console.log(`[wl-counter] OK — ${updated}/${slugs.length} sites atualizados`);
}

main().catch((e) => {
  console.error('[wl-counter] erro fatal:', e);
  process.exit(1);
});
