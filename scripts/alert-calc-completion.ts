// CL-201, CL-565-571 — alerta quando taxa calculator_completed/calculator_started cai >25% vs baseline 4 semanas
// Exit codes: 0 ok, 1 alerta, 2 dados ausentes
//
// Uso: tsx scripts/alert-calc-completion.ts [--dry-run]

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');
const THRESHOLD = parseFloat(process.env.CALC_COMPLETION_DROP_THRESHOLD ?? '0.25');
const SNAPSHOT_DIR = path.join(process.cwd(), '.cache', 'calc-completion-snapshots');

type Snapshot = {
  weekIso: string;
  perSite: Record<string, { started: number; completed: number; rate: number }>;
};

function loadSnapshots(): Snapshot[] {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), 'utf8')) as Snapshot);
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function fetchCurrent(): Promise<Snapshot['perSite']> {
  const fixture = path.join(process.cwd(), 'logs', 'calc-completion-current.json');
  if (fs.existsSync(fixture)) {
    return JSON.parse(fs.readFileSync(fixture, 'utf8'));
  }
  return {};
}

async function main() {
  const current = await fetchCurrent();
  if (Object.keys(current).length === 0) {
    console.error('[alert-calc-completion] Sem dados atuais — configurar GA4 Reporting');
    process.exit(2);
  }

  const history = loadSnapshots().slice(-4);
  const drops: Array<{ site: string; rate: number; baseline: number; delta: number }> = [];

  for (const [site, cur] of Object.entries(current)) {
    if (history.length === 0) continue;
    const baselineRate =
      history.reduce((sum, h) => sum + (h.perSite[site]?.rate ?? 0), 0) / history.length;
    if (baselineRate === 0) continue;
    const delta = (cur.rate - baselineRate) / baselineRate;
    if (delta <= -THRESHOLD) {
      drops.push({
        site,
        rate: Math.round(cur.rate * 1000) / 1000,
        baseline: Math.round(baselineRate * 1000) / 1000,
        delta: Math.round(delta * 1000) / 1000,
      });
    }
  }

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const week = isoWeek(new Date());
  if (!DRY) {
    const out = path.join(SNAPSHOT_DIR, `${week}.json`);
    fs.writeFileSync(out, JSON.stringify({ weekIso: week, perSite: current }, null, 2));
  }

  console.log(JSON.stringify({ week, threshold: THRESHOLD, drops }, null, 2));
  process.exit(drops.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[alert-calc-completion] error:', err);
  process.exit(2);
});
