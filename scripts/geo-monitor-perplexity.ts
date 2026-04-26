// CL-538 — query Perplexity API por keyword + verifica citacao do dominio
//
// Uso: tsx scripts/geo-monitor-perplexity.ts [--site=<slug>] [--all] [--dry-run]
// Output: stdout JSON Array<GeoQueryResult>; salva em output/reports/geo/{YYYY-MM}-perplexity.json

import fs from 'node:fs';
import path from 'node:path';
import { loadGeoMonitoringConfig, type GeoQueryResult } from '../src/schemas/geo-monitoring';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY ?? '';
const DRY = process.argv.includes('--dry-run');
const ALL = process.argv.includes('--all');
const SITE_FILTER = process.argv.find((a) => a.startsWith('--site='))?.split('=')[1];

async function queryPerplexity(keyword: string): Promise<{
  citations: string[];
  answer: string;
  raw: unknown;
}> {
  if (DRY || !PERPLEXITY_API_KEY) {
    return { citations: [], answer: '[dry-run]', raw: null };
  }
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-small-online',
      messages: [{ role: 'user', content: keyword }],
      return_citations: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`Perplexity API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };
  return {
    citations: data.citations ?? [],
    answer: data.choices?.[0]?.message?.content ?? '',
    raw: data,
  };
}

async function main() {
  const cfg = loadGeoMonitoringConfig();
  const results: GeoQueryResult[] = [];

  for (const [slug, site] of Object.entries(cfg.sites)) {
    if (SITE_FILTER && slug !== SITE_FILTER) continue;
    if (!ALL && !SITE_FILTER && site.priority !== 'high') continue;

    for (const keyword of site.keywords) {
      try {
        const r = await queryPerplexity(keyword);
        const present = r.citations.some((c) => c.includes(site.domain));
        const citation = r.citations.find((c) => c.includes(site.domain));
        results.push({
          source: 'perplexity',
          site: slug,
          keyword,
          present,
          citationUrl: citation,
          snippet: r.answer.slice(0, 240),
          collectedAt: new Date().toISOString(),
        });
        process.stderr.write(`[geo-perplexity] ${slug} | ${keyword} -> ${present ? 'PRESENT' : 'absent'}\n`);
      } catch (err) {
        process.stderr.write(`[geo-perplexity] error ${slug}/${keyword}: ${(err as Error).message}\n`);
      }
    }
  }

  const monthSlug = new Date().toISOString().slice(0, 7);
  const outDir = path.join(process.cwd(), 'output', 'reports', 'geo');
  fs.mkdirSync(outDir, { recursive: true });
  if (!DRY) {
    fs.writeFileSync(
      path.join(outDir, `${monthSlug}-perplexity.json`),
      JSON.stringify(results, null, 2),
    );
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
