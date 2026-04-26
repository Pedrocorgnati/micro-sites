#!/usr/bin/env tsx
/**
 * scripts/list-credentials-age.ts (CL-480)
 *
 * Le `.claude/projects/micro-sites.json > credentials.*` e lista
 * tokens com campo `lastRotated`. Alerta tokens com idade >365 dias.
 * Exit code 1 se algum vencido (uso em CI cron mensal).
 *
 * Uso:
 *   npx tsx scripts/list-credentials-age.ts
 *   npx tsx scripts/list-credentials-age.ts --threshold 180
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const tIdx = args.indexOf('--threshold');
const thresholdDays = tIdx >= 0 ? parseInt(args[tIdx + 1] ?? '365', 10) : 365;

// Localiza project.json (preferindo o do repo systemForge ou .claude/projects/)
const candidates = [
  resolve(process.cwd(), '.claude/projects/micro-sites.json'),
  resolve(process.cwd(), '../../../.claude/projects/micro-sites.json'),
];

let projectPath: string | null = null;
for (const p of candidates) {
  if (existsSync(p)) {
    projectPath = p;
    break;
  }
}

if (!projectPath) {
  console.error('[credentials-age] project.json nao encontrado em paths esperados.');
  console.error('  Buscado:', candidates.join(', '));
  process.exit(2);
}

const project = JSON.parse(readFileSync(projectPath, 'utf8')) as Record<string, unknown>;
const credentials = (project.credentials ?? {}) as Record<string, unknown>;

interface CredEntry {
  path: string;
  lastRotated: string;
  ageDays: number;
}

function walk(node: unknown, path: string, out: CredEntry[]): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (typeof obj.lastRotated === 'string') {
    const last = new Date(obj.lastRotated);
    if (!Number.isNaN(last.getTime())) {
      const age = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
      out.push({ path, lastRotated: obj.lastRotated, ageDays: age });
      return;
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    walk(v, path ? `${path}.${k}` : k, out);
  }
}

const entries: CredEntry[] = [];
walk(credentials, 'credentials', entries);

if (entries.length === 0) {
  console.warn('[credentials-age] Nenhum campo lastRotated encontrado em credentials.*');
  console.warn('  Adicione lastRotated: YYYY-MM-DD aos tokens conforme TOKEN-ROTATION-RUNBOOK.md');
  process.exit(0);
}

console.log('[credentials-age] threshold=' + thresholdDays + 'd entries=' + entries.length);
console.log();
console.log('Token'.padEnd(60) + 'lastRotated'.padEnd(14) + 'Idade');
console.log('-'.repeat(90));

let stale = 0;
for (const e of entries.sort((a, b) => b.ageDays - a.ageDays)) {
  const flag = e.ageDays >= thresholdDays ? '!! EXPIRADO' : '';
  console.log(e.path.padEnd(60) + e.lastRotated.padEnd(14) + `${e.ageDays}d ${flag}`);
  if (e.ageDays >= thresholdDays) stale++;
}

console.log();
if (stale > 0) {
  console.error(`[credentials-age] FAIL: ${stale} token(s) >= ${thresholdDays}d sem rotacao.`);
  console.error('  Rote conforme docs/operations/TOKEN-ROTATION-RUNBOOK.md');
  process.exit(1);
}

console.log('[credentials-age] OK: nenhum token vencido.');
