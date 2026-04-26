/**
 * dev-deploy-lock — lock cooperativo entre devs para deploy/push em deploy-NN.
 *
 * Cria/respeita arquivo .deploy-lock no root com TTL de 30min (configuravel).
 * Pre-push hook deve consultar este lock antes de push em branches deploy-*.
 *
 * Comandos:
 *   acquire [--user <name>] [--ttl <minutes>]  — adquire lock
 *   release [--user <name>]                    — libera lock (apenas se mesmo user)
 *   status                                     — imprime estado
 *   check  [--user <name>]                     — exit 0 se voce pode push, exit 1 caso contrario
 *
 * Usage (CLI):
 *   npx tsx scripts/dev-deploy-lock.ts acquire
 *   npx tsx scripts/dev-deploy-lock.ts release
 *   npx tsx scripts/dev-deploy-lock.ts status
 *   npx tsx scripts/dev-deploy-lock.ts check
 *
 * TASK-26 ST004 — gaps CL-313, CL-308, CL-069
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const LOCK_FILE = path.resolve('.deploy-lock');
const DEFAULT_TTL_MIN = 30;

interface LockState {
  user: string;
  acquiredAt: string; // ISO
  ttlMinutes: number;
  expiresAt: string; // ISO
  pid: number;
  hostname: string;
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1];
}

function detectUser(): string {
  const fromArg = arg('user');
  if (fromArg) return fromArg;
  // Tentar git config user.name
  try {
    return execSync('git config user.name', { encoding: 'utf-8' }).trim() || os.userInfo().username;
  } catch {
    return os.userInfo().username;
  }
}

function readLock(): LockState | null {
  if (!fs.existsSync(LOCK_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8')) as LockState;
  } catch {
    return null;
  }
}

function isExpired(lock: LockState): boolean {
  return Date.now() > Date.parse(lock.expiresAt);
}

function fmtRemaining(lock: LockState): string {
  const ms = Date.parse(lock.expiresAt) - Date.now();
  if (ms <= 0) return 'expirado';
  const min = Math.ceil(ms / 60000);
  return `${min}min`;
}

function acquire(): number {
  const user = detectUser();
  const ttlMinutes = Number(arg('ttl', String(DEFAULT_TTL_MIN)));
  const existing = readLock();

  if (existing && !isExpired(existing) && existing.user !== user) {
    console.error(
      `[deploy-lock] BLOQUEADO — lock detido por '${existing.user}' (host=${existing.hostname}, expira em ${fmtRemaining(existing)})`,
    );
    console.error(`Coordene via Slack/email antes de prosseguir.`);
    return 1;
  }

  const acquiredAt = new Date();
  const expiresAt = new Date(acquiredAt.getTime() + ttlMinutes * 60_000);
  const state: LockState = {
    user,
    acquiredAt: acquiredAt.toISOString(),
    ttlMinutes,
    expiresAt: expiresAt.toISOString(),
    pid: process.pid,
    hostname: os.hostname(),
  };
  fs.writeFileSync(LOCK_FILE, JSON.stringify(state, null, 2) + '\n', 'utf-8');
  console.log(
    `[deploy-lock] ADQUIRIDO por '${user}' por ${ttlMinutes}min (expira ${expiresAt.toISOString()})`,
  );
  return 0;
}

function release(): number {
  const user = detectUser();
  const existing = readLock();

  if (!existing) {
    console.log('[deploy-lock] sem lock ativo — nada a liberar');
    return 0;
  }

  if (existing.user !== user && !isExpired(existing)) {
    console.error(`[deploy-lock] NAO PODE LIBERAR — lock e de '${existing.user}', voce e '${user}'`);
    return 1;
  }

  fs.unlinkSync(LOCK_FILE);
  console.log(`[deploy-lock] LIBERADO (era de '${existing.user}')`);
  return 0;
}

function status(): number {
  const existing = readLock();
  if (!existing) {
    console.log('[deploy-lock] sem lock ativo');
    return 0;
  }
  if (isExpired(existing)) {
    console.log(`[deploy-lock] lock EXPIRADO — era de '${existing.user}' (acquiredAt=${existing.acquiredAt})`);
    return 0;
  }
  console.log(
    `[deploy-lock] ATIVO — user='${existing.user}' host='${existing.hostname}' acquiredAt=${existing.acquiredAt} expiresAt=${existing.expiresAt} (${fmtRemaining(existing)})`,
  );
  return 0;
}

function check(): number {
  const user = detectUser();
  const existing = readLock();
  if (!existing || isExpired(existing) || existing.user === user) return 0;
  console.error(
    `[deploy-lock] CHECK FAIL — '${existing.user}' segura o lock por mais ${fmtRemaining(existing)}`,
  );
  return 1;
}

function help(): number {
  console.log(`Uso: npx tsx scripts/dev-deploy-lock.ts <acquire|release|status|check> [--user <name>] [--ttl <minutes>]`);
  return 0;
}

function main(): void {
  const cmd = process.argv[2];
  let code = 0;
  switch (cmd) {
    case 'acquire':
      code = acquire();
      break;
    case 'release':
      code = release();
      break;
    case 'status':
      code = status();
      break;
    case 'check':
      code = check();
      break;
    default:
      code = help();
  }
  process.exit(code);
}

main();
