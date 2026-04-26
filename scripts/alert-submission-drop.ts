// CL-163, CL-565-571 — alerta quando submissions semanais < 70% media de 4 semanas
// Esperado: envs GA4_PROPERTY_ID + GA4_SERVICE_ACCOUNT_JSON_PATH (fallback: GSC ou SF API)
// Exit codes: 0 ok, 1 alerta disparado (drop), 2 dados ausentes
//
// Uso: tsx scripts/alert-submission-drop.ts [--dry-run] [--site=<slug>]

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');
const SITE_FILTER = process.argv.find((a) => a.startsWith('--site='))?.split('=')[1];
const THRESHOLD = parseFloat(process.env.SUBMISSION_DROP_THRESHOLD ?? '0.7');
const SNAPSHOT_DIR = path.join(process.cwd(), '.cache', 'submission-snapshots');

type WeeklySnapshot = {
  weekIso: string;
  perSite: Record<string, number>;
};

function loadSnapshots(): WeeklySnapshot[] {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), 'utf8')) as WeeklySnapshot);
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function fetchCurrentWeek(): Promise<Record<string, number>> {
  // Esqueleto: integracao real via GA4 Reporting API requer service account.
  // Em dev/dry-run, usar fixture local logs/submissions-current.json.
  const fixture = path.join(process.cwd(), 'logs', 'submissions-current.json');
  if (fs.existsSync(fixture)) {
    return JSON.parse(fs.readFileSync(fixture, 'utf8'));
  }
  return {};
}

async function main() {
  const current = await fetchCurrentWeek();
  if (Object.keys(current).length === 0) {
    console.error('[alert-submission-drop] Sem dados da semana atual — registrar GA4 Reporting integracao em PENDING-ACTIONS');
    process.exit(2);
  }

  const history = loadSnapshots().slice(-4);
  if (history.length < 4) {
    console.warn(`[alert-submission-drop] Historia insuficiente (${history.length}/4 semanas) — saving snapshot only`);
  }

  const drops: Array<{ site: string; current: number; avg4w: number; ratio: number }> = [];
  const allSites = new Set<string>(Object.keys(current));
  history.forEach((h) => Object.keys(h.perSite).forEach((s) => allSites.add(s)));

  for (const site of allSites) {
    if (SITE_FILTER && site !== SITE_FILTER) continue;
    const cur = current[site] ?? 0;
    const avg4w =
      history.length === 0
        ? 0
        : history.reduce((sum, h) => sum + (h.perSite[site] ?? 0), 0) / history.length;
    if (avg4w === 0) continue;
    const ratio = cur / avg4w;
    if (ratio < THRESHOLD) {
      drops.push({ site, current: cur, avg4w: Math.round(avg4w * 10) / 10, ratio: Math.round(ratio * 100) / 100 });
    }
  }

  // Persistir snapshot atual
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const week = isoWeek(new Date());
  if (!DRY) {
    const out = path.join(SNAPSHOT_DIR, `${week}.json`);
    fs.writeFileSync(out, JSON.stringify({ weekIso: week, perSite: current }, null, 2));
  }

  const payload = { week, threshold: THRESHOLD, drops };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(drops.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[alert-submission-drop] error:', err);
  process.exit(2);
});
