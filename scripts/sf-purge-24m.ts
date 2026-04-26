// CL-622 — purge de submissions Static Forms com >24 meses
// Static Forms gratuito nao tem API publica de DELETE; este script gera um CSV
// com os IDs/emails que precisam ser deletados manualmente no dashboard.
//
// Uso: tsx scripts/sf-purge-24m.ts [--dry-run] [--api-token=<token>]
// Exit codes: 0 ok, 1 alguns submissions sem suporte de API (CSV gerado), 2 erro

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');
const RETENTION_MONTHS = parseInt(process.env.SF_RETENTION_MONTHS ?? '24', 10);
const API_TOKEN = process.env.SF_API_TOKEN ?? process.argv.find((a) => a.startsWith('--api-token='))?.split('=')[1] ?? '';
const LOGS_DIR = path.join(process.cwd(), 'logs');

type Submission = {
  id: string;
  createdAt: string;
  email?: string;
  site?: string;
};

async function fetchAllSubmissions(): Promise<Submission[]> {
  // Esqueleto — Static Forms Free nao expoe API de listagem.
  // Em modo dry-run usar fixture local logs/sf-submissions.json (export manual do dashboard).
  const fixture = path.join(LOGS_DIR, 'sf-submissions.json');
  if (fs.existsSync(fixture)) {
    return JSON.parse(fs.readFileSync(fixture, 'utf8'));
  }
  if (!API_TOKEN) {
    console.error('[sf-purge] SF_API_TOKEN ausente e fixture nao encontrado — abortando');
    return [];
  }
  // Aqui entraria fetch real para SF Pro / Web3Forms se disponivel
  return [];
}

async function deleteViaApi(id: string): Promise<boolean> {
  if (!API_TOKEN) return false;
  // Esqueleto — API real seria DELETE /api/v1/submissions/{id}
  return false;
}

async function main() {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const all = await fetchAllSubmissions();
  if (all.length === 0) {
    console.log('[sf-purge] Sem submissions disponiveis (fixture/API ausente). Registrando PENDING-ACTIONS.');
    process.exit(2);
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);

  const expired = all.filter((s) => new Date(s.createdAt).getTime() < cutoff.getTime());
  if (expired.length === 0) {
    console.log('[sf-purge] OK — nenhuma submission >24m');
    process.exit(0);
  }

  const deleted: string[] = [];
  const manual: Submission[] = [];

  for (const s of expired) {
    if (DRY) {
      console.log(`[sf-purge] (dry-run) marcaria expired: ${s.id} (${s.createdAt})`);
      continue;
    }
    const ok = await deleteViaApi(s.id);
    if (ok) deleted.push(s.id);
    else manual.push(s);
  }

  const today = new Date().toISOString().slice(0, 10);
  const logPath = path.join(LOGS_DIR, `sf-purge-${today}.json`);
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      { date: today, retentionMonths: RETENTION_MONTHS, total: expired.length, deleted, manual },
      null,
      2,
    ),
  );

  if (manual.length > 0) {
    // CSV para purge manual
    const csvPath = path.join(LOGS_DIR, `sf-purge-manual-${today}.csv`);
    const header = 'id,email,site,createdAt\n';
    const rows = manual.map((s) => `${s.id},${s.email ?? ''},${s.site ?? ''},${s.createdAt}`).join('\n');
    fs.writeFileSync(csvPath, header + rows + '\n');
    console.log(`[sf-purge] WARN — ${manual.length} submissions exigem purge manual. CSV: ${csvPath}`);
  }

  console.log(`[sf-purge] DONE — total=${expired.length} deleted_via_api=${deleted.length} manual=${manual.length}`);
  process.exit(manual.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[sf-purge] erro:', err);
  process.exit(2);
});
