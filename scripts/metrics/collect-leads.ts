#!/usr/bin/env tsx
/**
 * collect-leads — coleta submissions do Static Forms agrupados por endpoint
 * e por utm_source (origem do micro-site).
 *
 * Requer STATIC_FORMS_API_KEY. Stub se ausente.
 */

import fs from 'node:fs';
import path from 'node:path';

type Lead = { slug: string; endpoint: string; count: number };

const OUT_DIR = path.join(process.cwd(), 'output', 'metrics');
fs.mkdirSync(OUT_DIR, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const outPath = path.join(OUT_DIR, `leads-${today}.json`);

const apiKey = process.env.STATIC_FORMS_API_KEY;
const endpoints = (process.env.STATIC_FORMS_ENDPOINTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function real(): Promise<Lead[]> {
  const results: Lead[] = [];
  for (const endpoint of endpoints) {
    const url = `https://api.staticforms.xyz/submissions?accessKey=${apiKey}&formId=${endpoint}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { submissions?: Array<{ _origin?: string }> };
      const bySlug = new Map<string, number>();
      for (const s of data.submissions ?? []) {
        const origin = s._origin ?? 'unknown';
        bySlug.set(origin, (bySlug.get(origin) ?? 0) + 1);
      }
      for (const [slug, count] of bySlug) {
        results.push({ slug, endpoint, count });
      }
    } catch (e) {
      console.warn(`[collect-leads] ${endpoint} falhou: ${(e as Error).message}`);
    }
  }
  return results;
}

function stub(): Lead[] {
  console.warn('[collect-leads] STATIC_FORMS_API_KEY ausente — stub');
  return [];
}

(async () => {
  const rows = apiKey ? await real() : stub();
  fs.writeFileSync(outPath, JSON.stringify({ collectedAt: today, rows }, null, 2));
  console.log(`[collect-leads] ${rows.length} leads → ${outPath}`);
})();
