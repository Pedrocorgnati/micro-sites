#!/usr/bin/env tsx
/**
 * monitor-hostinger-storage.ts
 * Conecta via SSH ao Hostinger Shared, executa `du -sh ~/public_html/*/`
 * e `df -h ~/public_html`, e emite JSON em `output/storage-report.json`.
 *
 * Gap coberto: CL-267 (monitor storage Hostinger).
 *
 * Variáveis de ambiente esperadas:
 *   HOSTINGER_SSH_HOST, HOSTINGER_SSH_USER, HOSTINGER_SSH_PORT (default 22),
 *   HOSTINGER_SSH_KEY_PATH (caminho da chave privada)
 *
 * Exit codes:
 *   0 = < 70%
 *   1 = 70% .. 89%  (warning)
 *   2 = >= 90%       (critical)
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const pexec = promisify(execFile);

const {
  HOSTINGER_SSH_HOST,
  HOSTINGER_SSH_USER,
  HOSTINGER_SSH_PORT = '22',
  HOSTINGER_SSH_KEY_PATH,
} = process.env;

type SiteUsage = { site: string; sizeBytes: number; sizeHuman: string };

const UNIT: Record<string, number> = { K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 };

export function parseDuOutput(stdout: string): SiteUsage[] {
  const out: SiteUsage[] = [];
  for (const line of stdout.split('\n')) {
    const m = /^([\d.]+)([KMGT])\s+.*?\/public_html\/([^\/]+)\/?\s*$/.exec(line.trim());
    if (!m) continue;
    const [, num, unit, site] = m;
    out.push({
      site,
      sizeHuman: `${num}${unit}`,
      sizeBytes: Math.round(parseFloat(num) * (UNIT[unit] ?? 1)),
    });
  }
  return out.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

export function parseDfOutput(stdout: string): { totalUsedGB: number; totalLimitGB: number; usagePercent: number } {
  const lines = stdout.split('\n').filter((l) => l.trim());
  const data = lines[lines.length - 1];
  const parts = data.split(/\s+/);
  const pct = parts.find((p) => p.endsWith('%'));
  const usagePercent = pct ? parseInt(pct.replace('%', ''), 10) : 0;
  const toGB = (s: string) => {
    const m = /^([\d.]+)([KMGT])?$/.exec(s);
    if (!m) return 0;
    const [, num, unit] = m;
    const bytes = parseFloat(num) * (unit ? UNIT[unit] ?? 1 : 1);
    return Math.round((bytes / UNIT.G) * 100) / 100;
  };
  return { totalUsedGB: toGB(parts[2] ?? ''), totalLimitGB: toGB(parts[1] ?? ''), usagePercent };
}

async function runSSH(cmd: string): Promise<string> {
  if (!HOSTINGER_SSH_HOST || !HOSTINGER_SSH_USER || !HOSTINGER_SSH_KEY_PATH) {
    throw new Error('SSH env vars ausentes (HOSTINGER_SSH_HOST/USER/KEY_PATH).');
  }
  const args = [
    '-i', HOSTINGER_SSH_KEY_PATH,
    '-p', HOSTINGER_SSH_PORT,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'BatchMode=yes',
    `${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}`,
    cmd,
  ];
  const { stdout } = await pexec('ssh', args, { maxBuffer: 4 * 1024 * 1024 });
  return stdout;
}

async function main() {
  try {
    const [duOut, dfOut] = await Promise.all([
      runSSH('du -sh ~/public_html/*/ 2>/dev/null | sort -rh'),
      runSSH('df -h ~/public_html | tail -1'),
    ]);
    const topSites = parseDuOutput(duOut);
    const disk = parseDfOutput(dfOut);
    const report = {
      generatedAt: new Date().toISOString(),
      ...disk,
      topSites: topSites.slice(0, 20),
      siteCount: topSites.length,
    };

    const outPath = path.resolve(process.cwd(), 'output/storage-report.json');
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(report, null, 2));

    console.log(`[monitor-hostinger-storage] ${disk.totalUsedGB}G / ${disk.totalLimitGB}G (${disk.usagePercent}%)`);
    if (disk.usagePercent >= 90) {
      console.error('[monitor-hostinger-storage] CRITICAL — uso >= 90%');
      process.exit(2);
    }
    if (disk.usagePercent >= 70) {
      console.warn('[monitor-hostinger-storage] WARNING — uso >= 70%');
      process.exit(1);
    }
  } catch (err) {
    console.error('[monitor-hostinger-storage] falhou:', (err as Error).message);
    process.exit(1);
  }
}

// Evita executar durante testes (quando importado como módulo)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
