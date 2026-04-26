// CL-116, CL-288, CL-298, CL-299 — flag dormente baseada em GA4/GSC/SF
// Marca lifecycle.dormant: true em config.json quando 2+ sinais negativos.
//
// Uso: tsx scripts/site-dormancy-watch.ts [--dry-run] [--site=<slug>]

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');
const SITE_FILTER = process.argv.find((a) => a.startsWith('--site='))?.split('=')[1];

type Criteria = {
  minSessions30d: number;
  minImpressions30d: number;
  minLeads6m: number;
  signalsToTriggerDormant: number;
  exemptSlugs: string[];
};

type SiteSignals = {
  sessions30d: number;
  impressions30d: number;
  leads6m: number;
};

const ROOT = process.cwd();
const SITES_DIR = path.join(ROOT, 'sites');
const CRITERIA = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'config', 'dormancy-criteria.json'), 'utf8'),
) as Criteria;

async function loadSignals(slug: string): Promise<SiteSignals> {
  // Esqueleto — em producao consultar GA4 Reporting API + GSC + SF
  // Em dev/CI usar fixture .cache/dormancy-signals.json
  const fixture = path.join(ROOT, '.cache', 'dormancy-signals.json');
  if (fs.existsSync(fixture)) {
    const data = JSON.parse(fs.readFileSync(fixture, 'utf8')) as Record<string, SiteSignals>;
    return data[slug] ?? { sessions30d: 0, impressions30d: 0, leads6m: 0 };
  }
  return { sessions30d: 0, impressions30d: 0, leads6m: 0 };
}

function countNegativeSignals(signals: SiteSignals): { count: number; details: string[] } {
  const details: string[] = [];
  let count = 0;
  if (signals.sessions30d < CRITERIA.minSessions30d) {
    details.push(`sessions30d=${signals.sessions30d} < ${CRITERIA.minSessions30d}`);
    count++;
  }
  if (signals.impressions30d < CRITERIA.minImpressions30d) {
    details.push(`impressions30d=${signals.impressions30d} < ${CRITERIA.minImpressions30d}`);
    count++;
  }
  if (signals.leads6m < CRITERIA.minLeads6m) {
    details.push(`leads6m=${signals.leads6m} < ${CRITERIA.minLeads6m}`);
    count++;
  }
  return { count, details };
}

async function main() {
  if (!fs.existsSync(SITES_DIR)) {
    console.error('[dormancy] sites/ nao existe');
    process.exit(2);
  }

  const slugs = fs
    .readdirSync(SITES_DIR)
    .filter((d) => !d.startsWith('_') && fs.statSync(path.join(SITES_DIR, d)).isDirectory());

  const report: Array<{
    slug: string;
    signals: SiteSignals;
    negativeCount: number;
    details: string[];
    action: 'mark_dormant' | 'unchanged' | 'exempt';
  }> = [];

  for (const slug of slugs) {
    if (SITE_FILTER && slug !== SITE_FILTER) continue;
    if (CRITERIA.exemptSlugs.includes(slug)) {
      report.push({ slug, signals: { sessions30d: 0, impressions30d: 0, leads6m: 0 }, negativeCount: 0, details: [], action: 'exempt' });
      continue;
    }
    const signals = await loadSignals(slug);
    const { count, details } = countNegativeSignals(signals);
    const triggersDormant = count >= CRITERIA.signalsToTriggerDormant;
    const cfgPath = path.join(SITES_DIR, slug, 'config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as {
      lifecycle?: { dormant?: boolean; dormantSince?: string };
    };
    const wasDormant = cfg.lifecycle?.dormant === true;

    if (triggersDormant && !wasDormant) {
      cfg.lifecycle = {
        ...(cfg.lifecycle ?? {}),
        dormant: true,
        dormantSince: new Date().toISOString(),
      };
      if (!DRY) fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
      report.push({ slug, signals, negativeCount: count, details, action: 'mark_dormant' });
    } else {
      report.push({ slug, signals, negativeCount: count, details, action: 'unchanged' });
    }
  }

  console.log(JSON.stringify({ criteria: CRITERIA, sites: report }, null, 2));
  const newlyDormant = report.filter((r) => r.action === 'mark_dormant').length;
  process.exit(newlyDormant > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[dormancy] erro:', err);
  process.exit(2);
});
