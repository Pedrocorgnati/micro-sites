// CL-112 — query Google + parse AI Overview snippet
// Estrategia: usa Tavily (ja em credentials.mcp_servers.tavily) com topic=general
// e tenta extrair `ai_overview` do response. Fallback documenta limitacao em runbook.
//
// Uso: tsx scripts/geo-monitor-google-ai-overviews.ts [--site=<slug>] [--all] [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { loadGeoMonitoringConfig, type GeoQueryResult } from '../src/schemas/geo-monitoring';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? '';
const DRY = process.argv.includes('--dry-run');
const ALL = process.argv.includes('--all');
const SITE_FILTER = process.argv.find((a) => a.startsWith('--site='))?.split('=')[1];

async function queryTavily(keyword: string): Promise<{
  urls: string[];
  aiOverview?: string;
  raw: unknown;
}> {
  if (DRY || !TAVILY_API_KEY) return { urls: [], aiOverview: '[dry-run]', raw: null };
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: keyword,
      topic: 'general',
      include_answer: true,
      include_raw_content: false,
      search_depth: 'basic',
      max_results: 10,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    results?: Array<{ url?: string }>;
    answer?: string;
  };
  return {
    urls: (data.results ?? []).map((r) => r.url).filter((u): u is string => Boolean(u)),
    aiOverview: data.answer,
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
        const r = await queryTavily(keyword);
        const citationUrl = r.urls.find((u) => u.includes(site.domain));
        const overviewMentions = r.aiOverview?.toLowerCase().includes(site.domain.toLowerCase()) ?? false;
        const position = citationUrl ? r.urls.indexOf(citationUrl) + 1 : undefined;
        results.push({
          source: 'google_ai_overview',
          site: slug,
          keyword,
          present: Boolean(citationUrl) || overviewMentions,
          position,
          citationUrl,
          snippet: r.aiOverview?.slice(0, 240),
          collectedAt: new Date().toISOString(),
        });
        process.stderr.write(`[geo-google] ${slug} | ${keyword} -> ${citationUrl ? `pos ${position}` : 'absent'}\n`);
      } catch (err) {
        process.stderr.write(`[geo-google] error ${slug}/${keyword}: ${(err as Error).message}\n`);
      }
    }
  }

  const monthSlug = new Date().toISOString().slice(0, 7);
  const outDir = path.join(process.cwd(), 'output', 'reports', 'geo');
  fs.mkdirSync(outDir, { recursive: true });
  if (!DRY) {
    fs.writeFileSync(
      path.join(outDir, `${monthSlug}-google-ai-overviews.json`),
      JSON.stringify(results, null, 2),
    );
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
