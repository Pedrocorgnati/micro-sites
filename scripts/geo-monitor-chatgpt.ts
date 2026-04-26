// CL-538 — query ChatGPT (OpenAI web search) por keyword + verifica citacao
//
// Uso: tsx scripts/geo-monitor-chatgpt.ts [--site=<slug>] [--all] [--dry-run]
// Limitacao: web search via OpenAI Responses API tem custo e latencia maior; uso reservado.
// Fallback: se OPENAI_API_KEY ausente, retorna lista vazia + log no runbook.

import fs from 'node:fs';
import path from 'node:path';
import { loadGeoMonitoringConfig, type GeoQueryResult } from '../src/schemas/geo-monitoring';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const MODEL = process.env.OPENAI_GEO_MODEL ?? 'gpt-4o-mini';
const DRY = process.argv.includes('--dry-run');
const ALL = process.argv.includes('--all');
const SITE_FILTER = process.argv.find((a) => a.startsWith('--site='))?.split('=')[1];

async function queryChatGPT(keyword: string): Promise<{ urls: string[]; answer: string; raw: unknown }> {
  if (DRY || !OPENAI_API_KEY) return { urls: [], answer: '[dry-run]', raw: null };

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      tools: [{ type: 'web_search_preview' }],
      input: keyword,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    output?: Array<{ content?: Array<{ text?: string; annotations?: Array<{ url?: string }> }> }>;
  };
  const urls: string[] = [];
  let answer = '';
  for (const part of data.output ?? []) {
    for (const item of part.content ?? []) {
      if (item.text) answer += item.text + '\n';
      for (const ann of item.annotations ?? []) {
        if (ann.url) urls.push(ann.url);
      }
    }
  }
  return { urls, answer, raw: data };
}

async function main() {
  const cfg = loadGeoMonitoringConfig();
  const results: GeoQueryResult[] = [];

  for (const [slug, site] of Object.entries(cfg.sites)) {
    if (SITE_FILTER && slug !== SITE_FILTER) continue;
    if (!ALL && !SITE_FILTER && site.priority !== 'high') continue;

    for (const keyword of site.keywords) {
      try {
        const r = await queryChatGPT(keyword);
        const citation = r.urls.find((u) => u.includes(site.domain));
        results.push({
          source: 'chatgpt',
          site: slug,
          keyword,
          present: Boolean(citation),
          citationUrl: citation,
          snippet: r.answer.slice(0, 240),
          collectedAt: new Date().toISOString(),
        });
        process.stderr.write(`[geo-chatgpt] ${slug} | ${keyword} -> ${citation ? 'PRESENT' : 'absent'}\n`);
      } catch (err) {
        process.stderr.write(`[geo-chatgpt] error ${slug}/${keyword}: ${(err as Error).message}\n`);
      }
    }
  }

  const monthSlug = new Date().toISOString().slice(0, 7);
  const outDir = path.join(process.cwd(), 'output', 'reports', 'geo');
  fs.mkdirSync(outDir, { recursive: true });
  if (!DRY) {
    fs.writeFileSync(
      path.join(outDir, `${monthSlug}-chatgpt.json`),
      JSON.stringify(results, null, 2),
    );
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
