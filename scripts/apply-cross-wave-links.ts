#!/usr/bin/env tsx
/**
 * apply-cross-wave-links.ts
 *
 * Wrapper pos-deploy que aplica wave-aware interlinking automaticamente.
 * Relacionado ao gap CL-115 (INTAKE-REVIEW TASK-1 ST003).
 *
 * Fluxo:
 *   1. Determina onda ativa a partir de --wave N | env ACTIVE_WAVE | output/wave-state.json (default 1).
 *   2. Calcula estado atual de crossLinks (antes).
 *   3. Invoca scripts/update-progressive-links.ts --wave N --apply.
 *   4. Re-le estado (depois) -> computa addedLinks, removedLinks, sitesTouched.
 *   5. Roda scripts/audit-waves.ts para validar consistencia.
 *   6. Grava output/cross-wave-report.json.
 *
 * Idempotente: segunda execucao consecutiva com a mesma onda deve reportar
 * addedLinks=0 e removedLinks=0 (alinhado a CL-081).
 *
 * Uso:
 *   tsx scripts/apply-cross-wave-links.ts --wave 1
 *   tsx scripts/apply-cross-wave-links.ts          # onda inferida (env/state/default 1)
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITES_ROOT = path.join(ROOT, 'sites');
const OUTPUT_ROOT = path.join(ROOT, 'output');
const WAVE_STATE_FILE = path.join(OUTPUT_ROOT, 'wave-state.json');
const REPORT_FILE = path.join(OUTPUT_ROOT, 'cross-wave-report.json');

type Wave = 1 | 2 | 3;

interface CrossLink {
  href: string;
  anchor?: string;
  context?: string;
  [k: string]: unknown;
}

interface SiteSnapshot {
  slug: string;
  wave?: number;
  links: CrossLink[];
}

function parseWaveArg(): Wave {
  const argv = process.argv.slice(2);
  const waveArg = argv.find((a) => a.startsWith('--wave'));
  let wave: number | undefined;

  if (waveArg?.includes('=')) {
    wave = Number(waveArg.split('=')[1]);
  } else {
    const idx = argv.indexOf('--wave');
    if (idx >= 0 && argv[idx + 1]) wave = Number(argv[idx + 1]);
  }

  if (wave === undefined) {
    const envWave = process.env.ACTIVE_WAVE;
    if (envWave) wave = Number(envWave);
  }

  if (wave === undefined && fs.existsSync(WAVE_STATE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(WAVE_STATE_FILE, 'utf-8')) as { activeWave?: number };
      if (state.activeWave) wave = Number(state.activeWave);
    } catch {
      // ignora, cai no default
    }
  }

  if (wave === undefined) wave = 1;

  if (wave !== 1 && wave !== 2 && wave !== 3) {
    throw new Error(`Onda invalida: ${wave}. Use 1, 2 ou 3.`);
  }
  return wave as Wave;
}

function snapshotSites(): SiteSnapshot[] {
  if (!fs.existsSync(SITES_ROOT)) {
    throw new Error(`sites/ nao encontrado em ${SITES_ROOT}`);
  }
  const out: SiteSnapshot[] = [];
  for (const entry of fs.readdirSync(SITES_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const cfgPath = path.join(SITES_ROOT, entry.name, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as {
      slug?: string;
      wave?: number;
      crossLinks?: CrossLink[];
      lifecycle?: { dormant?: boolean };
    };
    // CL-116, CL-288, CL-298, CL-299: sites com lifecycle.dormant=true sao
    // excluidos do interlinking cross-wave (nem source nem destino).
    if (cfg.lifecycle?.dormant === true) continue;
    out.push({
      slug: cfg.slug ?? entry.name,
      wave: cfg.wave,
      links: cfg.crossLinks ? cfg.crossLinks.map((l) => ({ ...l })) : [],
    });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

function diffSnapshots(before: SiteSnapshot[], after: SiteSnapshot[]) {
  const beforeBySlug = new Map(before.map((s) => [s.slug, s]));
  const afterBySlug = new Map(after.map((s) => [s.slug, s]));

  let addedLinks = 0;
  let removedLinks = 0;
  const sitesTouched: string[] = [];

  for (const [slug, a] of afterBySlug) {
    const b = beforeBySlug.get(slug);
    const beforeSet = new Set((b?.links ?? []).map((l) => l.href));
    const afterSet = new Set(a.links.map((l) => l.href));

    let added = 0;
    let removed = 0;
    for (const href of afterSet) if (!beforeSet.has(href)) added++;
    for (const href of beforeSet) if (!afterSet.has(href)) removed++;

    if (added > 0 || removed > 0) sitesTouched.push(slug);
    addedLinks += added;
    removedLinks += removed;
  }

  return { addedLinks, removedLinks, sitesTouched };
}

interface CrossWaveReport {
  ok: boolean;
  activeWave: Wave;
  addedLinks: number;
  removedLinks: number;
  sitesTouched: string[];
  siteCount: number;
  auditOk: boolean;
  auditStderr?: string;
  progressiveLinksStdoutTail?: string;
  timestamp: string;
}

function runScript(
  script: string,
  args: string[],
): { code: number; stdout: string; stderr: string } {
  const result = spawnSync('npx', ['tsx', script, ...args], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

async function main(): Promise<void> {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  const wave = parseWaveArg();

  console.log('━'.repeat(60));
  console.log(`CROSS-WAVE LINKING — onda ativa: ${wave}`);
  console.log('━'.repeat(60));

  const before = snapshotSites();
  console.log(`Sites inventariados: ${before.length}`);

  const progressive = runScript('scripts/update-progressive-links.ts', [
    '--wave',
    String(wave),
    '--apply',
  ]);
  if (progressive.code !== 0) {
    console.error('update-progressive-links falhou:');
    console.error(progressive.stderr || progressive.stdout);
    process.exit(progressive.code);
  }

  const after = snapshotSites();
  const { addedLinks, removedLinks, sitesTouched } = diffSnapshots(before, after);

  const audit = runScript('scripts/audit-waves.ts', []);
  const auditOk = audit.code === 0;

  const report: CrossWaveReport = {
    ok: auditOk && removedLinks >= 0,
    activeWave: wave,
    addedLinks,
    removedLinks,
    sitesTouched,
    siteCount: after.length,
    auditOk,
    auditStderr: auditOk ? undefined : audit.stderr || audit.stdout,
    progressiveLinksStdoutTail: progressive.stdout.split('\n').slice(-8).join('\n'),
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log('');
  console.log(`Links adicionados: ${addedLinks}`);
  console.log(`Links removidos:   ${removedLinks}`);
  console.log(`Sites tocados:     ${sitesTouched.length}`);
  console.log(`Audit waves:       ${auditOk ? 'ok' : 'FAIL'}`);
  console.log(`Relatorio:         ${path.relative(ROOT, REPORT_FILE)}`);

  if (!auditOk) {
    console.error('');
    console.error('✗ audit-waves detectou divergencia. Veja output/cross-wave-report.json.');
    process.exit(1);
  }

  process.exit(0);
}

const invokedDirectly =
  typeof process.argv[1] === 'string' &&
  path.basename(process.argv[1]).startsWith('apply-cross-wave-links');

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
