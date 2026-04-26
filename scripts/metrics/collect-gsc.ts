#!/usr/bin/env tsx
/**
 * collect-gsc — coleta metricas GSC (impressions/clicks/avg position) por site.
 *
 * Requer: GSC_SERVICE_ACCOUNT_JSON (path do JSON) + GSC_SITE_URLS (csv slug=url).
 * Se credenciais ausentes, gera output stub com zeros e warning (nao falha
 * o pipeline — CI continua funcionando sem creds locais).
 *
 * Output: output/metrics/gsc-YYYY-MM-DD.json
 */

import fs from 'node:fs';
import path from 'node:path';

type Row = { slug: string; url: string; impressions: number; clicks: number; ctr: number; position: number };

const OUT_DIR = path.join(process.cwd(), 'output', 'metrics');
fs.mkdirSync(OUT_DIR, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const outPath = path.join(OUT_DIR, `gsc-${today}.json`);

const credPath = process.env.GSC_SERVICE_ACCOUNT_JSON;
const sitesMap = (process.env.GSC_SITE_URLS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pair) => pair.split('='))
  .map(([slug, url]) => ({ slug, url }));

async function real(): Promise<Row[]> {
  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    keyFile: credPath!,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const sc = google.searchconsole({ version: 'v1', auth: await auth.getClient() as never });
  const startDate = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const endDate = today;
  const rows: Row[] = [];
  for (const { slug, url } of sitesMap) {
    try {
      const res = await sc.searchanalytics.query({
        siteUrl: url,
        requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 1 },
      });
      const r = res.data.rows?.[0];
      rows.push({
        slug,
        url,
        impressions: r?.impressions ?? 0,
        clicks: r?.clicks ?? 0,
        ctr: r?.ctr ?? 0,
        position: r?.position ?? 0,
      });
    } catch (e) {
      console.warn(`[collect-gsc] ${slug} falhou: ${(e as Error).message}`);
    }
  }
  return rows;
}

function stub(): Row[] {
  console.warn('[collect-gsc] GSC_SERVICE_ACCOUNT_JSON ausente — gerando stub');
  return sitesMap.map((s) => ({ ...s, impressions: 0, clicks: 0, ctr: 0, position: 0 }));
}

(async () => {
  const rows = credPath && fs.existsSync(credPath) ? await real() : stub();
  fs.writeFileSync(outPath, JSON.stringify({ collectedAt: today, rows }, null, 2));
  console.log(`[collect-gsc] ${rows.length} sites → ${outPath}`);
})();
