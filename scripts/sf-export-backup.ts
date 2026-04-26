/**
 * sf-export-backup — backup semanal das submissions de Static Forms.
 *
 * Static Forms nao tem GET API publico no plano gratuito. Modos suportados:
 *   --mode=api      — usa SF_API_KEY (Pro plan) — fetch /submissions
 *   --mode=manual   — le `output/exports/sf-manual-export.json` (Pedro exporta do dashboard)
 *
 * Saida: output/backups/sf/{YYYY-WW}.json
 *   Schema versionado:
 *     { version: 1, week: "2026-W17", endpoints: { "<endpoint>": [{...submission}], ... }, exported_at: ISO }
 *
 * Retencao: 24 meses (alinhado LGPD), expurgo via cron separado.
 *
 * TASK-22 ST001 — gaps CL-572, CL-573, CL-574
 *
 * Usage:
 *   npx tsx scripts/sf-export-backup.ts --mode=manual
 *   SF_API_KEY=... npx tsx scripts/sf-export-backup.ts --mode=api
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BACKUPS_DIR = path.resolve('output/backups/sf');
const EXPORTS_DIR = path.resolve('output/exports');
const MODE = (() => {
  const i = process.argv.indexOf('--mode');
  return (i >= 0 ? process.argv[i + 1] : 'manual') as 'manual' | 'api';
})();

interface Submission {
  id: string;
  endpoint: string;
  email_hash: string;
  data: Record<string, unknown>;
  created_at: string;
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+date - +yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

function maskSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v !== 'string') {
      masked[k] = v;
      continue;
    }
    // Mascarar email/telefone diretamente; manter outros
    if (k.toLowerCase() === 'email') {
      masked[`${k}_hash`] = hashEmail(v);
    } else if (/(phone|telefone|cellphone)/i.test(k)) {
      masked[k] = v.replace(/\d/g, '*').slice(0, 14);
    } else {
      masked[k] = v;
    }
  }
  return masked;
}

async function fetchApiSubmissions(): Promise<Submission[]> {
  const apiKey = process.env.SF_API_KEY;
  if (!apiKey) {
    console.warn('[sf-backup] SF_API_KEY ausente — retorna vazio');
    return [];
  }
  const url = 'https://api.staticforms.xyz/submissions';
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) {
      console.warn(`[sf-backup] api ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { submissions?: Array<Record<string, unknown>> };
    return (data.submissions ?? []).map((s) => ({
      id: String(s.id ?? s._id ?? ''),
      endpoint: String(s.formId ?? s.endpoint ?? ''),
      email_hash: hashEmail(String(s.email ?? '')),
      data: maskSensitive(s as Record<string, unknown>),
      created_at: String(s.created_at ?? s.createdAt ?? new Date().toISOString()),
    }));
  } catch (e) {
    console.warn('[sf-backup] api error:', e instanceof Error ? e.message : e);
    return [];
  }
}

function loadManualSubmissions(): Submission[] {
  const f = path.join(EXPORTS_DIR, 'sf-manual-export.json');
  if (!fs.existsSync(f)) {
    console.warn(`[sf-backup] manual file ausente: ${f}`);
    return [];
  }
  try {
    const raw = JSON.parse(fs.readFileSync(f, 'utf-8')) as { submissions?: Array<Record<string, unknown>> };
    return (raw.submissions ?? []).map((s) => ({
      id: String(s.id ?? crypto.randomUUID()),
      endpoint: String(s.endpoint ?? s.formId ?? 'unknown'),
      email_hash: hashEmail(String(s.email ?? '')),
      data: maskSensitive(s as Record<string, unknown>),
      created_at: String(s.created_at ?? new Date().toISOString()),
    }));
  } catch {
    console.warn('[sf-backup] manual file corrompido');
    return [];
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  const submissions = MODE === 'api' ? await fetchApiSubmissions() : loadManualSubmissions();

  // Dedup by id
  const byId = new Map<string, Submission>();
  for (const s of submissions) byId.set(s.id || `${s.endpoint}-${s.created_at}`, s);
  const deduped = Array.from(byId.values());

  // Group by endpoint
  const byEndpoint: Record<string, Submission[]> = {};
  for (const s of deduped) {
    (byEndpoint[s.endpoint] ??= []).push(s);
  }

  const week = isoWeek(new Date());
  const file = path.join(BACKUPS_DIR, `${week}.json`);
  const payload = {
    version: 1,
    week,
    mode: MODE,
    exported_at: new Date().toISOString(),
    total_submissions: deduped.length,
    endpoints: byEndpoint,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`[sf-backup] ${file}`);
  console.log(`[sf-backup] total=${deduped.length} endpoints=${Object.keys(byEndpoint).length}`);

  // Cleanup > 24m (730 dias)
  const cutoff = Date.now() - 730 * 24 * 3600 * 1000;
  for (const f of fs.readdirSync(BACKUPS_DIR)) {
    if (!f.endsWith('.json')) continue;
    const stat = fs.statSync(path.join(BACKUPS_DIR, f));
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(path.join(BACKUPS_DIR, f));
      console.log(`[sf-backup] expurgado (>24m): ${f}`);
    }
  }
}

main().catch((e) => {
  console.error('[sf-backup] erro fatal:', e);
  process.exit(1);
});
