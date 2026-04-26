#!/usr/bin/env tsx
/**
 * Gerador do dashboard operacional da rede (CL-274/275).
 * Le config/sites-monitoring.json + (opcional) analytics-export.json
 * e gera docs/ops/network-dashboard.md com tabela agregada.
 */
import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE = process.cwd();
const MONITORING = path.join(WORKSPACE, 'config/sites-monitoring.json');
const ANALYTICS = path.join(WORKSPACE, 'config/analytics-export.json');
const OUT = path.join(WORKSPACE, 'docs/ops/network-dashboard.md');

interface SiteRow {
  slug: string;
  category?: string;
  wave?: number | string;
  sessions30d?: number;
  cvr?: number;
  avgPosition?: number;
  lastRefresh?: string;
  status?: string;
}

function loadJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) as T; } catch { return fallback; }
}

function main(): void {
  const monitoring = loadJson<{ sites?: SiteRow[] }>(MONITORING, {});
  const analytics = loadJson<Record<string, Partial<SiteRow>>>(ANALYTICS, {});
  const rows = (monitoring.sites ?? []).map(s => ({ ...s, ...(analytics[s.slug] ?? {}) }))
    .sort((a, b) => String(a.wave).localeCompare(String(b.wave)) || a.slug.localeCompare(b.slug));

  const header = '| Slug | Cat | Onda | Sessoes 30d | CVR | Pos. media | Ultimo refresh | Status |';
  const sep = '|------|-----|------|-------------|-----|-----------|----------------|--------|';
  const lines = rows.map(r =>
    `| ${r.slug} | ${r.category ?? '-'} | ${r.wave ?? '-'} | ${r.sessions30d ?? '-'} | ` +
    `${r.cvr != null ? (r.cvr * 100).toFixed(2) + '%' : '-'} | ${r.avgPosition ?? '-'} | ` +
    `${r.lastRefresh ?? '-'} | ${r.status ?? '-'} |`,
  );
  const now = new Date().toISOString();
  const body = [
    '# Network Dashboard — Micro Sites',
    '',
    `**Gerado em:** ${now}`,
    `**Fontes:** config/sites-monitoring.json, config/analytics-export.json`,
    `**Total de sites:** ${rows.length}`,
    '',
    '## Status consolidado',
    '',
    header,
    sep,
    ...lines,
    '',
    '## Como atualizar',
    '',
    '1. Exportar GA4 (ultimos 30d) para `config/analytics-export.json`.',
    '2. Rodar `npm run ops:dashboard`.',
    '3. Abrir PR com o diff deste arquivo.',
    '',
    '> Playbook de refresh: [refresh-playbook.md](./refresh-playbook.md)',
    '> RACI: [raci-matrix.md](./raci-matrix.md)',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body);
  console.log(`[generate-network-dashboard] OK — ${rows.length} sites em ${path.relative(WORKSPACE, OUT)}`);
}

main();
