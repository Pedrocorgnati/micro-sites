/**
 * kpi-tracker — agregra os 3 KPIs canonicos da rede mensal.
 *
 * KPI 1 — % sites com >=1 keyword em 1a pagina GSC (meta 30%)
 *   Fonte: GSC searchanalytics (position <=10)
 *
 * KPI 2 — Total leads/mes (meta 20+)
 *   Fonte: SF API (Pro) ou manual export -> output/exports/sf-manual-export.json
 *
 * KPI 3 — Projetos fechados/mes (meta 2-3)
 *   Fonte: data/projects-closed.json (manual Pedro)
 *
 * Output: output/reports/kpi-monthly/{YYYY-MM}.md
 *
 * Alert: se 2+ meses consecutivos com KPI < 50% meta, exit code 2 (workflow abre issue).
 *
 * TASK-27 ST002 — gaps CL-012, CL-013, CL-014
 *
 * Usage:
 *   npx tsx scripts/kpi-tracker.ts [--month YYYY-MM]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const REPORTS_DIR = path.join(ROOT, 'output/reports/kpi-monthly');
const PROJECTS_FILE = path.join(ROOT, 'data/projects-closed.json');
const SF_MANUAL = path.join(ROOT, 'output/exports/sf-manual-export.json');
const SITES_DIR = path.join(ROOT, 'sites');
const GSC_CREDENTIALS = process.env.GSC_CREDENTIALS ?? 'secrets/gsc-service-account.json';

const MONTH = (() => {
  const i = process.argv.indexOf('--month');
  return i >= 0 ? process.argv[i + 1] : new Date().toISOString().slice(0, 7);
})();

const TARGETS = {
  kpi1_first_page_pct: 30, // %
  kpi2_leads_per_month: 20,
  kpi3_projects_per_month: 2,
};

const ALERT_THRESHOLD_PCT = 50;

interface KpiSnapshot {
  month: string;
  kpi1_first_page_pct: number;
  kpi1_sites_with_top10: number;
  kpi1_total_sites: number;
  kpi2_leads: number;
  kpi3_projects: number;
  meta: typeof TARGETS;
  alert_triggered: string[];
}

function listSiteDomains(): Array<{ slug: string; domain: string }> {
  const out: Array<{ slug: string; domain: string }> = [];
  if (!fs.existsSync(SITES_DIR)) return out;
  for (const slug of fs.readdirSync(SITES_DIR)) {
    if (slug.startsWith('_')) continue;
    const cfg = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfg)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(cfg, 'utf-8')) as { siteUrl?: string };
      if (c.siteUrl) out.push({ slug, domain: new URL(c.siteUrl).hostname });
    } catch {
      /* skip */
    }
  }
  return out;
}

function monthBounds(yyyymm: string): { start: string; end: string } {
  const [y, m] = yyyymm.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

async function fetchKpi1(month: string): Promise<{ pct: number; sitesWith: number; total: number }> {
  const sites = listSiteDomains();
  if (sites.length === 0 || !fs.existsSync(GSC_CREDENTIALS)) {
    console.warn('[kpi] GSC credentials ausentes ou nenhum site — KPI 1 estimado em 0');
    return { pct: 0, sitesWith: 0, total: sites.length };
  }
  try {
    const { google } = await import('googleapis');
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      keyFile: GSC_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    const client = await auth.getClient();
    const webmasters = google.webmasters({ version: 'v3', auth: client as never });
    const { start, end } = monthBounds(month);

    let sitesWith = 0;
    for (const s of sites) {
      try {
        const res = await webmasters.searchanalytics.query({
          siteUrl: `https://${s.domain}/`,
          requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 100 },
        });
        const rows = res.data.rows ?? [];
        const hasTop10 = rows.some((r) => (r.position ?? 999) <= 10 && (r.impressions ?? 0) > 0);
        if (hasTop10) sitesWith++;
      } catch {
        /* skip site */
      }
    }
    return {
      pct: Math.round((sitesWith / Math.max(sites.length, 1)) * 100),
      sitesWith,
      total: sites.length,
    };
  } catch (e) {
    console.warn('[kpi] erro GSC:', e instanceof Error ? e.message : e);
    return { pct: 0, sitesWith: 0, total: sites.length };
  }
}

function loadKpi2(): number {
  if (!fs.existsSync(SF_MANUAL)) {
    console.warn(`[kpi] SF manual export ausente: ${SF_MANUAL} — KPI 2 = 0`);
    return 0;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(SF_MANUAL, 'utf-8')) as { submissions?: Array<{ created_at?: string }> };
    const subs = raw.submissions ?? [];
    return subs.filter((s) => (s.created_at ?? '').slice(0, 7) === MONTH).length;
  } catch {
    return 0;
  }
}

function loadKpi3(): number {
  if (!fs.existsSync(PROJECTS_FILE)) {
    console.warn(`[kpi] projects file ausente: ${PROJECTS_FILE} — KPI 3 = 0`);
    return 0;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8')) as { projects?: Array<{ closed_at?: string }> };
    return (raw.projects ?? []).filter((p) => (p.closed_at ?? '').slice(0, 7) === MONTH).length;
  } catch {
    return 0;
  }
}

function checkAlerts(snap: KpiSnapshot): string[] {
  const alerts: string[] = [];
  if (snap.kpi1_first_page_pct < TARGETS.kpi1_first_page_pct * (ALERT_THRESHOLD_PCT / 100)) {
    alerts.push(`KPI 1 (${snap.kpi1_first_page_pct}%) < 50% da meta (${TARGETS.kpi1_first_page_pct}%)`);
  }
  if (snap.kpi2_leads < TARGETS.kpi2_leads_per_month * (ALERT_THRESHOLD_PCT / 100)) {
    alerts.push(`KPI 2 (${snap.kpi2_leads} leads) < 50% da meta (${TARGETS.kpi2_leads_per_month})`);
  }
  if (snap.kpi3_projects < Math.ceil(TARGETS.kpi3_projects_per_month * (ALERT_THRESHOLD_PCT / 100))) {
    alerts.push(`KPI 3 (${snap.kpi3_projects} projetos) < 50% da meta (${TARGETS.kpi3_projects_per_month})`);
  }
  return alerts;
}

async function main(): Promise<void> {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const k1 = await fetchKpi1(MONTH);
  const k2 = loadKpi2();
  const k3 = loadKpi3();

  const snap: KpiSnapshot = {
    month: MONTH,
    kpi1_first_page_pct: k1.pct,
    kpi1_sites_with_top10: k1.sitesWith,
    kpi1_total_sites: k1.total,
    kpi2_leads: k2,
    kpi3_projects: k3,
    meta: TARGETS,
    alert_triggered: [],
  };
  snap.alert_triggered = checkAlerts(snap);

  const file = path.join(REPORTS_DIR, `${MONTH}.md`);
  const lines = [
    `# KPI Monthly Report — ${MONTH}`,
    '',
    '## Resultados',
    '',
    `| KPI | Atual | Meta | Status |`,
    `|---|---|---|---|`,
    `| 1. Sites com keyword em 1a pag GSC | ${snap.kpi1_first_page_pct}% (${snap.kpi1_sites_with_top10}/${snap.kpi1_total_sites}) | ${TARGETS.kpi1_first_page_pct}% | ${snap.kpi1_first_page_pct >= TARGETS.kpi1_first_page_pct ? 'OK' : 'BELOW'} |`,
    `| 2. Leads/mes | ${snap.kpi2_leads} | ${TARGETS.kpi2_leads_per_month}+ | ${snap.kpi2_leads >= TARGETS.kpi2_leads_per_month ? 'OK' : 'BELOW'} |`,
    `| 3. Projetos fechados/mes | ${snap.kpi3_projects} | ${TARGETS.kpi3_projects_per_month}-3 | ${snap.kpi3_projects >= TARGETS.kpi3_projects_per_month ? 'OK' : 'BELOW'} |`,
    '',
    '## Alertas',
    '',
    snap.alert_triggered.length === 0
      ? '_(nenhum alerta — KPIs OK ou >50% meta)_'
      : snap.alert_triggered.map((a) => `- ${a}`).join('\n'),
    '',
    `Gerado em ${new Date().toISOString()} por scripts/kpi-tracker.ts`,
  ];
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf-8');

  // JSON tambem para consumo programatico
  fs.writeFileSync(file.replace('.md', '.json'), JSON.stringify(snap, null, 2));

  console.log(`[kpi] ${file}`);
  console.log(`[kpi] KPI 1: ${snap.kpi1_first_page_pct}% | KPI 2: ${snap.kpi2_leads} | KPI 3: ${snap.kpi3_projects}`);
  if (snap.alert_triggered.length > 0) {
    console.warn(`[kpi] ALERTAS: ${snap.alert_triggered.length}`);
    for (const a of snap.alert_triggered) console.warn(`  - ${a}`);
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('[kpi] erro fatal:', e);
  process.exit(1);
});
