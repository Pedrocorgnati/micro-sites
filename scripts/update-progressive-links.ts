/**
 * update-progressive-links.ts
 *
 * Aplica wave-aware interlinking em todos sites/<slug>/config.json.
 * Gap CL-085 — TASK-1 ST004.
 *
 * Uso:
 *   tsx scripts/update-progressive-links.ts --wave 1           # dry-run
 *   tsx scripts/update-progressive-links.ts --wave 1 --apply   # grava mudancas
 *
 * Para cada site com wave <= --wave, remove do array crossLinks quaisquer
 * links cujo destino seja um site com wave > --wave (ainda nao-deployado).
 * Links para landing SystemForge (systemforge.com.br) sao sempre preservados.
 */

import fs from 'fs';
import path from 'path';
import {
  Wave,
  SiteManifestEntry,
  CrossLinkInput,
  getCrossLinksForWave,
} from '../src/lib/wave-interlinking';

const SITES_ROOT = path.join(process.cwd(), 'sites');

interface SiteConfigFile {
  slug: string;
  wave?: Wave;
  crossLinks?: CrossLinkInput[];
  [k: string]: unknown;
}

function parseArgs(argv: string[]): { wave: Wave; apply: boolean } {
  const waveArg = argv.find((a) => a.startsWith('--wave'));
  const apply = argv.includes('--apply');

  let wave: number | undefined;
  if (waveArg?.includes('=')) wave = Number(waveArg.split('=')[1]);
  else {
    const idx = argv.indexOf('--wave');
    if (idx >= 0 && argv[idx + 1]) wave = Number(argv[idx + 1]);
  }

  if (wave !== 1 && wave !== 2 && wave !== 3) {
    throw new Error('Use --wave 1|2|3');
  }
  return { wave: wave as Wave, apply };
}

function loadManifest(): { manifest: SiteManifestEntry[]; files: Array<{ path: string; config: SiteConfigFile }> } {
  if (!fs.existsSync(SITES_ROOT)) {
    throw new Error(`sites/ nao encontrado em ${SITES_ROOT}`);
  }

  const entries = fs
    .readdirSync(SITES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'));

  const manifest: SiteManifestEntry[] = [];
  const files: Array<{ path: string; config: SiteConfigFile }> = [];

  for (const dir of entries) {
    const cfgPath = path.join(SITES_ROOT, dir.name, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    const raw = fs.readFileSync(cfgPath, 'utf-8');
    const parsed = JSON.parse(raw) as SiteConfigFile;
    if (parsed.wave !== 1 && parsed.wave !== 2 && parsed.wave !== 3) continue;
    manifest.push({ slug: parsed.slug ?? dir.name, wave: parsed.wave });
    files.push({ path: cfgPath, config: parsed });
  }

  return { manifest, files };
}

interface Change {
  site: string;
  before: number;
  after: number;
  removed: CrossLinkInput[];
}

function main(): void {
  const { wave, apply } = parseArgs(process.argv.slice(2));
  const { manifest, files } = loadManifest();

  const changes: Change[] = [];

  for (const { path: cfgPath, config } of files) {
    if (!config.wave || config.wave > wave) continue;
    if (!config.crossLinks || config.crossLinks.length === 0) continue;

    const before = config.crossLinks.slice();
    const after = getCrossLinksForWave(before, wave, manifest);

    if (after.length === before.length) continue;

    const removed = before.filter((b) => !after.some((a) => a.href === b.href));
    changes.push({ site: config.slug, before: before.length, after: after.length, removed });

    if (apply) {
      const next = { ...config, crossLinks: after };
      fs.writeFileSync(cfgPath, JSON.stringify(next, null, 2) + '\n', 'utf-8');
    }
  }

  console.log('━'.repeat(60));
  console.log(`WAVE-AWARE INTERLINKING — wave ${wave} ${apply ? '(APPLY)' : '(dry-run)'}`);
  console.log('━'.repeat(60));
  console.log(`Sites no manifesto: ${manifest.length}`);
  console.log(`Sites alterados:    ${changes.length}`);

  if (changes.length === 0) {
    console.log('Nenhuma mudanca necessaria — todos crossLinks ja respeitam a onda.');
    process.exit(0);
  }

  for (const c of changes) {
    console.log('');
    console.log(`[${c.site}] crossLinks: ${c.before} -> ${c.after}`);
    for (const r of c.removed) {
      console.log(`  removido: ${r.href} (${r.context})`);
    }
  }

  if (!apply) {
    console.log('');
    console.log('Nenhum arquivo foi gravado. Re-execute com --apply para persistir.');
  }
  process.exit(0);
}

main();
