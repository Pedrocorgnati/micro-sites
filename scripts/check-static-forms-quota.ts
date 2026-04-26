#!/usr/bin/env tsx
/**
 * check-static-forms-quota — alerta quando site se aproxima da cota 500/mes
 * do plano Free do Static Forms.
 *
 * Thresholds: >450 = alert (90%). >400 = warn (80%).
 *
 * Requer STATIC_FORMS_API_KEY e STATIC_FORMS_ENDPOINTS (csv slug=formId).
 * Sem creds: exit 0 com warning — util para rodar em dev.
 */

import fs from 'node:fs';
import path from 'node:path';

const QUOTA = 500;
const WARN = 400;
const ALERT = 450;

const apiKey = process.env.STATIC_FORMS_API_KEY;
const raw = process.env.STATIC_FORMS_ENDPOINTS ?? '';
const endpoints = raw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pair) => {
    const [slug, formId] = pair.split('=');
    return { slug, formId };
  });

if (!apiKey || endpoints.length === 0) {
  console.warn('[quota] STATIC_FORMS_API_KEY ou STATIC_FORMS_ENDPOINTS ausentes — skip');
  process.exit(0);
}

type Result = {
  slug: string;
  count: number;
  pct: number;
  status: 'OK' | 'WARN' | 'ALERT' | 'OVER' | 'ERROR';
  error?: string;
};
const results: Result[] = [];

(async () => {
  for (const { slug, formId } of endpoints) {
    const url = `https://api.staticforms.xyz/v2/forms/${formId}/submissions?accessKey=${apiKey}&period=month`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { submissions?: unknown[]; count?: number };
      const count = data.count ?? data.submissions?.length ?? 0;
      const pct = (count / QUOTA) * 100;
      const status: Result['status'] =
        count >= QUOTA ? 'OVER' : count >= ALERT ? 'ALERT' : count >= WARN ? 'WARN' : 'OK';
      results.push({ slug, count, pct, status });
    } catch (e) {
      const msg = (e as Error).message;
      console.warn(`[quota] ${slug} falhou: ${msg}`);
      // TASK-6 ST002: endpoint response nao-2xx ou erro de rede = status ERROR
      results.push({ slug, count: 0, pct: 0, status: 'ERROR', error: msg });
    }
  }

  const OUT_DIR = path.join(process.cwd(), 'output', 'metrics');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT_DIR, `quota-${today}.json`), JSON.stringify(results, null, 2));

  // TASK-6 ST002: health file no root, lido pelo painel ops e pelo hook
  // de monitoring para detectar endpoint degradado/offline (gap CL-255).
  const health = {
    generatedAt: new Date().toISOString(),
    endpoint: process.env.STATIC_FORMS_URL ?? 'https://api.staticforms.xyz',
    total: results.length,
    byStatus: {
      OK: results.filter((r) => r.status === 'OK').length,
      WARN: results.filter((r) => r.status === 'WARN').length,
      ALERT: results.filter((r) => r.status === 'ALERT').length,
      OVER: results.filter((r) => r.status === 'OVER').length,
      ERROR: results.filter((r) => r.status === 'ERROR').length,
    },
    results,
  };
  fs.writeFileSync(path.join(process.cwd(), '.forms-health.json'), JSON.stringify(health, null, 2));

  console.log('[quota] resumo:');
  for (const r of results) console.log(`  ${r.status.padEnd(5)} ${r.slug}: ${r.count}/${QUOTA} (${r.pct.toFixed(1)}%)`);

  // TASK-6 ST002: alerta explicito em stdout em >=80% (WARN).
  const warns = results.filter((r) => r.status === 'WARN');
  if (warns.length > 0) {
    console.warn(
      `[quota] ALERTA 80%: ${warns.length} site(s) em WARN (>=80% da cota). ` +
        `Avaliar swap/upgrade preventivo. Sites: ${warns.map((w) => w.slug).join(', ')}`,
    );
  }
  const errs = results.filter((r) => r.status === 'ERROR');
  if (errs.length > 0) {
    console.error(
      `[quota] ENDPOINT DEGRADADO: ${errs.length} site(s) retornaram nao-2xx/erro. ` +
        `Considere trocar STATIC_FORMS_URL. Sites: ${errs.map((e) => e.slug).join(', ')}`,
    );
  }

  const flagged = results.filter((r) => r.status === 'ALERT' || r.status === 'OVER');
  if (flagged.length > 0) {
    console.error(
      `[quota] ACAO: ${flagged.length} site(s) >=90%. Avaliar upgrade Static Forms Pro. ` +
        `Sites: ${flagged.map((f) => f.slug).join(', ')}`,
    );

    // TASK-8 ST001 intake-review (CL-117): criar issue GitHub quando algum site
    // atingir OVER (>=100%). Requer gh CLI autenticado via GITHUB_TOKEN (CI).
    const over = results.filter((r) => r.status === 'OVER');
    if (over.length > 0 && process.env.GITHUB_TOKEN) {
      try {
        const { execSync } = await import('node:child_process');
        const body = [
          `# Static Forms quota EXCEDIDA`,
          ``,
          `${over.length} site(s) ultrapassaram 500/mes:`,
          ...over.map((o) => `- \`${o.slug}\`: ${o.count}/${QUOTA}`),
          ``,
          `**Acao:** upgrade Static Forms Pro ou swap do provider via \`STATIC_FORMS_URL\`.`,
        ].join('\n');
        execSync(
          `gh issue create --title "Static Forms quota OVER (${over.length})" --label "quota,ops" --body ${JSON.stringify(body)}`,
          { stdio: 'inherit' },
        );
      } catch (e) {
        console.warn('[quota] falha ao criar issue:', (e as Error).message);
      }
    }

    process.exit(1);
  }
  if (errs.length > 0) process.exit(2);
  process.exit(0);
})();
