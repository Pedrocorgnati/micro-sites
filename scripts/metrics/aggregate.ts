#!/usr/bin/env tsx
/**
 * aggregate — consolida gsc/ga4/leads do dia corrente em um dashboard HTML.
 *
 * Saida: output/metrics/dashboard-YYYY-MM-DD.html + summary.json
 * KPIs: total leads, conversao %, breakdown por categoria, top sites.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const METRICS = path.join(ROOT, 'output', 'metrics');
const SITES = path.join(ROOT, 'sites');
const today = new Date().toISOString().slice(0, 10);

function load<T>(file: string, fallback: T): T {
  const full = path.join(METRICS, file);
  if (!fs.existsSync(full)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch {
    return fallback;
  }
}

const gsc = load<{ rows: Array<{ slug: string; impressions: number; clicks: number }> }>(`gsc-${today}.json`, { rows: [] });
const ga4 = load<{ rows: Array<{ slug: string; sessions: number; users: number; conversions: number }> }>(`ga4-${today}.json`, { rows: [] });
const leads = load<{ rows: Array<{ slug: string; count: number }> }>(`leads-${today}.json`, { rows: [] });

type SiteAgg = {
  slug: string;
  category: string;
  impressions: number;
  clicks: number;
  sessions: number;
  users: number;
  leads: number;
  conversionRate: number;
};

const byCategory: Record<string, SiteAgg[]> = {};
const dirs = fs.readdirSync(SITES).filter((d) => !d.startsWith('_'));
const aggs: SiteAgg[] = [];

for (const slug of dirs) {
  const cfgPath = path.join(SITES, slug, 'config.json');
  if (!fs.existsSync(cfgPath)) continue;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const cat = (cfg.category ?? '?').toUpperCase();
  const gs = gsc.rows.find((r) => r.slug === slug || r.slug === slug.split('-')[0]);
  const ga = ga4.rows.find((r) => r.slug === slug || r.slug === slug.split('-')[0]);
  const lead = leads.rows.filter((r) => r.slug === slug || r.slug === slug.split('-')[0]).reduce((s, r) => s + r.count, 0);
  const sessions = ga?.sessions ?? 0;
  const agg: SiteAgg = {
    slug,
    category: cat,
    impressions: gs?.impressions ?? 0,
    clicks: gs?.clicks ?? 0,
    sessions,
    users: ga?.users ?? 0,
    leads: lead,
    conversionRate: sessions > 0 ? (lead / sessions) * 100 : 0,
  };
  aggs.push(agg);
  (byCategory[cat] ??= []).push(agg);
}

const totalLeads = aggs.reduce((s, a) => s + a.leads, 0);
const totalSessions = aggs.reduce((s, a) => s + a.sessions, 0);
const overallConv = totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0;

const breakdown = Object.entries(byCategory).map(([cat, arr]) => ({
  category: cat,
  sites: arr.length,
  leads: arr.reduce((s, a) => s + a.leads, 0),
  sessions: arr.reduce((s, a) => s + a.sessions, 0),
  conversionRate: (() => {
    const s = arr.reduce((x, a) => x + a.sessions, 0);
    const l = arr.reduce((x, a) => x + a.leads, 0);
    return s > 0 ? (l / s) * 100 : 0;
  })(),
}));

const summary = { collectedAt: today, totalLeads, totalSessions, overallConvPct: overallConv, breakdown, sites: aggs };
fs.writeFileSync(path.join(METRICS, `summary-${today}.json`), JSON.stringify(summary, null, 2));

const topSites = [...aggs].sort((a, b) => b.leads - a.leads).slice(0, 10);

const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><title>Micro Sites — Dashboard ${today}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  body { font-family: system-ui, sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; }
  h1 { margin-bottom: 0; } .sub { color: #64748b; margin-bottom: 2rem; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .kpi { background: #f8fafc; padding: 1rem; border-radius: 8px; }
  .kpi .v { font-size: 2rem; font-weight: 700; } .kpi .l { font-size: .85rem; color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .9rem; }
  th, td { padding: .5rem .75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
  th { background: #f1f5f9; }
</style></head><body>
<h1>Dashboard de Metricas</h1>
<p class="sub">Coletado em ${today}</p>
<div class="kpis">
  <div class="kpi"><div class="v">${totalLeads}</div><div class="l">Leads (rede)</div></div>
  <div class="kpi"><div class="v">${totalSessions}</div><div class="l">Sessoes (rede)</div></div>
  <div class="kpi"><div class="v">${overallConv.toFixed(2)}%</div><div class="l">Conversao media</div></div>
  <div class="kpi"><div class="v">${aggs.length}</div><div class="l">Sites monitorados</div></div>
</div>

<h2>Breakdown por categoria</h2>
<canvas id="catChart" height="80"></canvas>
<table>
  <thead><tr><th>Categoria</th><th>Sites</th><th>Leads</th><th>Sessoes</th><th>Conversao %</th></tr></thead>
  <tbody>${breakdown.map((b) => `<tr><td>${b.category}</td><td>${b.sites}</td><td>${b.leads}</td><td>${b.sessions}</td><td>${b.conversionRate.toFixed(2)}</td></tr>`).join('')}</tbody>
</table>

<h2>Top 10 sites por leads</h2>
<table>
  <thead><tr><th>Slug</th><th>Cat</th><th>Leads</th><th>Sessoes</th><th>Conversao %</th></tr></thead>
  <tbody>${topSites.map((s) => `<tr><td>${s.slug}</td><td>${s.category}</td><td>${s.leads}</td><td>${s.sessions}</td><td>${s.conversionRate.toFixed(2)}</td></tr>`).join('')}</tbody>
</table>

<script>
const ctx = document.getElementById('catChart');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(breakdown.map((b) => b.category))},
    datasets: [
      { label: 'Leads', data: ${JSON.stringify(breakdown.map((b) => b.leads))}, backgroundColor: '#7c3aed' },
      { label: 'Sessoes/100', data: ${JSON.stringify(breakdown.map((b) => Math.round(b.sessions / 100)))}, backgroundColor: '#06b6d4' }
    ]
  },
  options: { responsive: true, plugins: { legend: { position: 'top' } } }
});
</script>
</body></html>
`;

const htmlPath = path.join(METRICS, `dashboard-${today}.html`);
fs.writeFileSync(htmlPath, html);
console.log(`[aggregate] dashboard → ${htmlPath}`);
console.log(`[aggregate] summary   → ${path.join(METRICS, `summary-${today}.json`)}`);
