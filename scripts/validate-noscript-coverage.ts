#!/usr/bin/env tsx
/**
 * validate-noscript-coverage.ts
 *
 * Gate de deploy: garante que toda pagina sensivel a JS renderiza
 * <NoscriptFallback>. Relacionado ao gap CL-251 (INTAKE-REVIEW TASK-1 ST002).
 *
 * Pages auditadas (rotas compartilhadas em src/app/ servidas por qualquer
 * site Categoria D via env SITE_SLUG):
 *   /resultado, /quanto-custa, /lista-de-espera, /diagnostico, /contato
 *
 * Uso:
 *   tsx scripts/validate-noscript-coverage.ts           # audita; exit 1 se faltar
 *   tsx scripts/validate-noscript-coverage.ts --json    # so imprime JSON
 *
 * Export:
 *   runCoverage() -> { missing, siteCount, routes, timestamp }
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITES_ROOT = path.join(ROOT, 'sites');
const APP_ROOT = path.join(ROOT, 'src', 'app');
const OUTPUT_ROOT = path.join(ROOT, 'output');

const ROUTES = ['resultado', 'quanto-custa', 'lista-de-espera', 'diagnostico', 'contato'] as const;
type Route = (typeof ROUTES)[number];

const IMPORT_RE =
  /import\s*\{[^}]*\bNoscriptFallback\b[^}]*\}\s*from\s*['"]@\/components\/sections\/NoscriptFallback['"]/;
const USAGE_RE = /<NoscriptFallback\b/;

export interface CoverageMissing {
  route: Route;
  file: string;
  reason: 'file-missing' | 'import-missing' | 'not-rendered';
}

export interface CoverageReport {
  ok: boolean;
  siteCount: number;
  routes: Route[];
  missing: CoverageMissing[];
  sitesChecked: string[];
  timestamp: string;
}

function listDSites(): string[] {
  if (!fs.existsSync(SITES_ROOT)) {
    throw new Error(`sites/ nao encontrado em ${SITES_ROOT}`);
  }
  const dSites: string[] = [];
  for (const entry of fs.readdirSync(SITES_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const cfgPath = path.join(SITES_ROOT, entry.name, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as { category?: string };
    if (cfg.category === 'D') dSites.push(entry.name);
  }
  return dSites.sort();
}

function checkRoute(route: Route): CoverageMissing | null {
  const file = path.join(APP_ROOT, route, 'page.tsx');
  const rel = path.relative(ROOT, file);
  if (!fs.existsSync(file)) {
    return { route, file: rel, reason: 'file-missing' };
  }
  const src = fs.readFileSync(file, 'utf-8');
  if (!IMPORT_RE.test(src)) {
    return { route, file: rel, reason: 'import-missing' };
  }
  if (!USAGE_RE.test(src)) {
    return { route, file: rel, reason: 'not-rendered' };
  }
  return null;
}

export async function runCoverage(): Promise<CoverageReport> {
  const sites = listDSites();
  const missing: CoverageMissing[] = [];
  for (const route of ROUTES) {
    const issue = checkRoute(route);
    if (issue) missing.push(issue);
  }
  return {
    ok: missing.length === 0,
    siteCount: sites.length,
    routes: [...ROUTES],
    missing,
    sitesChecked: sites,
    timestamp: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  const report = await runCoverage();
  const asJson = process.argv.includes('--json');

  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_ROOT, 'noscript-coverage-report.json'),
    JSON.stringify(report, null, 2) + '\n',
    'utf-8',
  );

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }

  const header = '━'.repeat(60);
  console.log(header);
  console.log('NOSCRIPT COVERAGE AUDIT');
  console.log(header);
  console.log(`Sites Categoria D:   ${report.siteCount}`);
  console.log(`Rotas auditadas:     ${report.routes.length}`);
  console.log('');

  if (report.ok) {
    console.log(`✓ ${report.siteCount} sites D cobertos (${report.routes.length} rotas cada)`);
    process.exit(0);
  }

  console.log(`✗ ${report.missing.length} rota(s) sem NoscriptFallback:`);
  for (const m of report.missing) {
    console.log(`  - /${m.route} (${m.file}): ${m.reason}`);
  }
  console.log('');
  console.log('Fix: importe e renderize <NoscriptFallback> antes do bloco interativo.');
  process.exit(1);
}

const invokedDirectly =
  typeof process.argv[1] === 'string' &&
  path.basename(process.argv[1]).startsWith('validate-noscript-coverage');

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
