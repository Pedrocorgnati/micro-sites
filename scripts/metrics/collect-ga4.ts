#!/usr/bin/env tsx
/**
 * collect-ga4 — coleta sessions/users/conversions por site (dimension pageLocation).
 * Requer GA4_SERVICE_ACCOUNT_JSON + GA4_PROPERTY_ID. Stub se ausente.
 */

import fs from 'node:fs';
import path from 'node:path';

type Row = { slug: string; sessions: number; users: number; conversions: number };

const OUT_DIR = path.join(process.cwd(), 'output', 'metrics');
fs.mkdirSync(OUT_DIR, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const outPath = path.join(OUT_DIR, `ga4-${today}.json`);

const credPath = process.env.GA4_SERVICE_ACCOUNT_JSON;
const propertyId = process.env.GA4_PROPERTY_ID;
const slugs = (process.env.GA4_SLUGS ?? '').split(',').filter(Boolean);

async function real(): Promise<Row[]> {
  const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
  const client = new BetaAnalyticsDataClient({ keyFilename: credPath });
  const rows: Row[] = [];
  for (const slug of slugs) {
    const [res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pageLocation' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }],
      dimensionFilter: { filter: { fieldName: 'pageLocation', stringFilter: { matchType: 'CONTAINS', value: slug } } },
    });
    const row = res.rows?.[0];
    rows.push({
      slug,
      sessions: Number(row?.metricValues?.[0]?.value ?? 0),
      users: Number(row?.metricValues?.[1]?.value ?? 0),
      conversions: Number(row?.metricValues?.[2]?.value ?? 0),
    });
  }
  return rows;
}

function stub(): Row[] {
  console.warn('[collect-ga4] credenciais ausentes — stub');
  return slugs.map((slug) => ({ slug, sessions: 0, users: 0, conversions: 0 }));
}

(async () => {
  const rows = credPath && fs.existsSync(credPath) && propertyId ? await real() : stub();
  fs.writeFileSync(outPath, JSON.stringify({ collectedAt: today, rows }, null, 2));
  console.log(`[collect-ga4] ${rows.length} sites → ${outPath}`);
})();
