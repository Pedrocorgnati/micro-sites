// CL-112, CL-538 — consolida 3 fontes em relatorio markdown mensal
// Roda apos os 3 monitores; produz output/reports/geo/{YYYY-MM}.md
//
// Uso: tsx scripts/geo-aggregate-report.ts [--month=YYYY-MM]

import fs from 'node:fs';
import path from 'node:path';
import type { GeoQueryResult } from '../src/schemas/geo-monitoring';

const MONTH = process.argv.find((a) => a.startsWith('--month='))?.split('=')[1] ?? new Date().toISOString().slice(0, 7);
const REPORTS_DIR = path.join(process.cwd(), 'output', 'reports', 'geo');

function load(file: string): GeoQueryResult[] {
  const p = path.join(REPORTS_DIR, file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadPrevMonth(): { perplexity: GeoQueryResult[]; chatgpt: GeoQueryResult[]; google: GeoQueryResult[] } | null {
  const prev = new Date(`${MONTH}-01T00:00:00Z`);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const ps = prev.toISOString().slice(0, 7);
  const tryLoad = (s: string) => {
    const p = path.join(REPORTS_DIR, `${ps}-${s}.json`);
    return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')) as GeoQueryResult[]) : [];
  };
  const out = {
    perplexity: tryLoad('perplexity'),
    chatgpt: tryLoad('chatgpt'),
    google: tryLoad('google-ai-overviews'),
  };
  if (!out.perplexity.length && !out.chatgpt.length && !out.google.length) return null;
  return out;
}

function aggregate(rows: GeoQueryResult[]): Record<string, { total: number; present: number; pct: number }> {
  const out: Record<string, { total: number; present: number; pct: number }> = {};
  for (const r of rows) {
    if (!out[r.site]) out[r.site] = { total: 0, present: 0, pct: 0 };
    out[r.site].total += 1;
    if (r.present) out[r.site].present += 1;
  }
  Object.values(out).forEach((s) => (s.pct = s.total > 0 ? s.present / s.total : 0));
  return out;
}

function delta(curr: number | undefined, prev: number | undefined): string {
  if (curr === undefined && prev === undefined) return '—';
  const c = curr ?? 0;
  const p = prev ?? 0;
  const d = c - p;
  if (d === 0) return '=';
  const sign = d > 0 ? '+' : '';
  return `${sign}${(d * 100).toFixed(1)}pp`;
}

function main() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const perplexity = load(`${MONTH}-perplexity.json`);
  const chatgpt = load(`${MONTH}-chatgpt.json`);
  const google = load(`${MONTH}-google-ai-overviews.json`);

  const prev = loadPrevMonth();

  const aggP = aggregate(perplexity);
  const aggC = aggregate(chatgpt);
  const aggG = aggregate(google);
  const aggPP = prev ? aggregate(prev.perplexity) : {};
  const aggCC = prev ? aggregate(prev.chatgpt) : {};
  const aggGG = prev ? aggregate(prev.google) : {};

  const sites = Array.from(
    new Set([...Object.keys(aggP), ...Object.keys(aggC), ...Object.keys(aggG)]),
  ).sort();

  const lines: string[] = [];
  lines.push(`# GEO Monitoring — ${MONTH}`, '');
  lines.push(`Gerado em ${new Date().toISOString()}`, '');
  lines.push('## Resumo por site (% citacao por motor)', '');
  lines.push('| Site | Perplexity | Δ M-1 | ChatGPT | Δ M-1 | Google AI | Δ M-1 |');
  lines.push('|------|------------|-------|---------|-------|-----------|-------|');
  for (const s of sites) {
    const p = aggP[s];
    const c = aggC[s];
    const g = aggG[s];
    lines.push(
      `| ${s} | ${p ? (p.pct * 100).toFixed(1) + '%' : '—'} | ${delta(p?.pct, aggPP[s]?.pct)} | ${
        c ? (c.pct * 100).toFixed(1) + '%' : '—'
      } | ${delta(c?.pct, aggCC[s]?.pct)} | ${g ? (g.pct * 100).toFixed(1) + '%' : '—'} | ${delta(
        g?.pct,
        aggGG[s]?.pct,
      )} |`,
    );
  }

  lines.push('', '## Acoes recomendadas', '');
  lines.push('Vide `docs/seo/GEO-MONITORING-RUNBOOK.md`. Sinais de queda em 2 meses consecutivos -> refresh do conteudo top performer.');

  const outPath = path.join(REPORTS_DIR, `${MONTH}.md`);
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
  console.log(outPath);
}

main();
