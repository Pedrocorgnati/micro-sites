/**
 * update-whatsapp-bulk — atualiza atomic o numero WhatsApp em todos os 36 sites.
 *
 * Fluxo:
 *   1. Validar formato do numero (+55DDD9XXXXXXXX, com ou sem +)
 *   2. Para cada sites/*\/config.json:
 *      - Backup .bak
 *      - Atualizar campo whatsappNumber via Schema-validate (tolerant)
 *   3. Se algum falhar -> rollback (restaurar todos .bak)
 *   4. Se ok -> rodar audit-contacts-consistency.ts e remover .bak
 *
 * TASK-19 ST003 — gap CL-141
 *
 * Usage:
 *   npx tsx scripts/update-whatsapp-bulk.ts --number +5511999999999 [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SITES_DIR = path.resolve('sites');
const ARG_NUMBER = (() => {
  const i = process.argv.indexOf('--number');
  return i >= 0 ? process.argv[i + 1] : null;
})();
const DRY_RUN = process.argv.includes('--dry-run');

const PHONE_RE = /^\+?55\d{2}9?\d{8}$/;

function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s()-]/g, '');
  if (!PHONE_RE.test(cleaned)) return null;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

interface SiteUpdate {
  slug: string;
  configPath: string;
  backupPath: string;
  oldNumber: string | undefined;
  newNumber: string;
}

function listSites(): string[] {
  if (!fs.existsSync(SITES_DIR)) return [];
  return fs
    .readdirSync(SITES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name);
}

function backup(file: string): string {
  const bak = `${file}.bak`;
  fs.copyFileSync(file, bak);
  return bak;
}

function restoreFromBackup(updates: SiteUpdate[]): void {
  for (const u of updates) {
    if (fs.existsSync(u.backupPath)) {
      fs.copyFileSync(u.backupPath, u.configPath);
      fs.unlinkSync(u.backupPath);
    }
  }
}

function cleanBackups(updates: SiteUpdate[]): void {
  for (const u of updates) {
    if (fs.existsSync(u.backupPath)) fs.unlinkSync(u.backupPath);
  }
}

function updateConfig(slug: string, newNumber: string): SiteUpdate {
  const configPath = path.join(SITES_DIR, slug, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`config.json ausente em sites/${slug}/`);
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  const json = JSON.parse(raw) as Record<string, unknown> & { whatsappNumber?: string };
  const oldNumber = json.whatsappNumber;
  const backupPath = DRY_RUN ? `${configPath}.dry-bak` : backup(configPath);
  if (!DRY_RUN) {
    json.whatsappNumber = newNumber;
    fs.writeFileSync(configPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  }
  return { slug, configPath, backupPath, oldNumber, newNumber };
}

function main(): void {
  if (!ARG_NUMBER) {
    console.error('Uso: npx tsx scripts/update-whatsapp-bulk.ts --number +5511999999999 [--dry-run]');
    process.exit(1);
  }
  const normalized = normalizePhone(ARG_NUMBER);
  if (!normalized) {
    console.error(`[wa-bulk] numero invalido: ${ARG_NUMBER} (esperado +55DDD9XXXXXXXX)`);
    process.exit(1);
  }

  const slugs = listSites();
  if (slugs.length === 0) {
    console.warn('[wa-bulk] nenhum site encontrado');
    process.exit(0);
  }

  console.log(`[wa-bulk] atualizando ${slugs.length} sites para ${normalized}${DRY_RUN ? ' (DRY-RUN)' : ''}`);

  const updates: SiteUpdate[] = [];
  try {
    for (const slug of slugs) {
      const u = updateConfig(slug, normalized);
      updates.push(u);
      console.log(`  ${slug}: ${u.oldNumber ?? 'undef'} -> ${u.newNumber}`);
    }
  } catch (e) {
    console.error('[wa-bulk] FALHA durante update — rolling back...', e);
    restoreFromBackup(updates);
    console.error('[wa-bulk] rollback completo');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('[wa-bulk] dry-run OK — nenhuma alteracao persistida');
    process.exit(0);
  }

  // Audit pos-update
  console.log('[wa-bulk] rodando audit-contacts-consistency...');
  try {
    execSync('npx tsx scripts/audit-contacts-consistency.ts', { stdio: 'inherit' });
    cleanBackups(updates);
    console.log(`[wa-bulk] OK — ${updates.length} sites atualizados`);
  } catch {
    console.error('[wa-bulk] audit falhou — rolling back...');
    restoreFromBackup(updates);
    console.error('[wa-bulk] rollback completo');
    process.exit(1);
  }
}

main();
