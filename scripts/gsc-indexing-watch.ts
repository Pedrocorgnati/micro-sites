// CL-122 — alerta quando GSC indexed URLs caem >20% w/w para algum site
// Esperado: GSC service account em GSC_SERVICE_ACCOUNT_JSON_PATH
// Exit codes: 0 ok, 1 alerta disparado, 2 dados ausentes / config errada
//
// Uso: tsx scripts/gsc-indexing-watch.ts [--dry-run]

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');
const THRESHOLD = parseFloat(process.env.GSC_DROP_THRESHOLD ?? '0.2');
const SNAPSHOT_DIR = path.join(process.cwd(), '.cache', 'gsc-indexing-snapshots');
const SAMPLE_SIZE = parseInt(process.env.GSC_SAMPLE_SIZE ?? '5', 10);

type Snapshot = {
  weekIso: string;
  perSite: Record<string, { sampledUrls: number; indexed: number; pct: number }>;
};

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function loadLastSnapshot(): Snapshot | null {
  if (!fs.existsSync(SNAPSHOT_DIR)) return null;
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) return null;
  return JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, files[files.length - 1]), 'utf8'));
}

async function inspectSiteSample(site: string): Promise<{ sampled: number; indexed: number }> {
  // Esqueleto — em producao usar @googleapis/searchconsole + service account JSON.
  // Em dev usar fixture .cache/gsc-current.json
  const fixture = path.join(process.cwd(), '.cache', 'gsc-current.json');
  if (fs.existsSync(fixture)) {
    const data = JSON.parse(fs.readFileSync(fixture, 'utf8')) as Record<
      string,
      { sampled: number; indexed: number }
    >;
    return data[site] ?? { sampled: 0, indexed: 0 };
  }
  return { sampled: 0, indexed: 0 };
}

async function main() {
  const sitesDir = path.join(process.cwd(), 'sites');
  if (!fs.existsSync(sitesDir)) {
    console.error('[gsc-watch] sites/ nao existe');
    process.exit(2);
  }
  const slugs = fs
    .readdirSync(sitesDir)
    .filter((d) => !d.startsWith('_') && fs.statSync(path.join(sitesDir, d)).isDirectory());

  const current: Snapshot['perSite'] = {};
  for (const slug of slugs) {
    const r = await inspectSiteSample(slug);
    current[slug] = {
      sampledUrls: r.sampled,
      indexed: r.indexed,
      pct: r.sampled > 0 ? r.indexed / r.sampled : 0,
    };
  }

  const last = loadLastSnapshot();
  const drops: Array<{ site: string; lastPct: number; pct: number; delta: number }> = [];

  if (last) {
    for (const [site, cur] of Object.entries(current)) {
      const prev = last.perSite[site]?.pct ?? 0;
      if (prev === 0) continue;
      const delta = (cur.pct - prev) / prev;
      if (delta <= -THRESHOLD) {
        drops.push({
          site,
          lastPct: Math.round(prev * 100) / 100,
          pct: Math.round(cur.pct * 100) / 100,
          delta: Math.round(delta * 100) / 100,
        });
      }
    }
  }

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const week = isoWeek(new Date());
  if (!DRY) {
    fs.writeFileSync(
      path.join(SNAPSHOT_DIR, `${week}.json`),
      JSON.stringify({ weekIso: week, perSite: current }, null, 2),
    );
  }

  console.log(JSON.stringify({ week, threshold: THRESHOLD, sample: SAMPLE_SIZE, drops }, null, 2));
  process.exit(drops.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[gsc-watch] error:', err);
  process.exit(2);
});
