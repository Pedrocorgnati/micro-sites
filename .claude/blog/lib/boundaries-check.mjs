#!/usr/bin/env node
/**
 * Blog Daily — Boundaries enforcement.
 *
 * Verifica que git diff (staged ou ultimo commit) respeita allowed_write_paths
 * de config.json. Rejeita writes em src/, public/, package.json, etc.
 *
 * Uso (pre-commit hook):
 *   node .claude/blog/lib/boundaries-check.mjs --staged
 *
 * Uso (post-routine — verifica ultimo commit):
 *   node .claude/blog/lib/boundaries-check.mjs --commit HEAD
 *
 * Uso (cli explicito):
 *   node .claude/blog/lib/boundaries-check.mjs --files path1.md path2.md ...
 *
 * Exit codes:
 *   0 — todos os arquivos dentro da allowlist
 *   1 — pelo menos 1 arquivo fora da allowlist (lista no stderr)
 *   2 — config.json invalido / nao parseou
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// fileURLToPath garante decode correto cross-platform (Windows: /C:/... → C:\...).
const __dirname_resolved = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname_resolved, '..', '..', '..');
const CONFIG_PATH = path.join(REPO_ROOT, '.claude', 'blog', 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`[boundaries-check] config.json ausente em ${CONFIG_PATH}`);
    process.exit(2);
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error(`[boundaries-check] config.json invalido: ${e.message}`);
    process.exit(2);
  }
}

/**
 * Converte glob pattern (basico) em RegExp.
 * `*`  = um ou mais chars sem `/` (proibe segment vazio — F006).
 * `**` = zero ou mais chars incluindo `/`.
 * `?`  = um char sem `/`.
 */
function globToRegex(glob) {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__GLOBSTAR__')
    .replace(/\*/g, '[^/]+') // F006: + em vez de * para exigir pelo menos 1 char
    .replace(/__GLOBSTAR__/g, '.*')
    .replace(/\?/g, '[^/]');
  return new RegExp('^' + re + '$');
}

function getChangedFiles(args) {
  const idxStaged = args.indexOf('--staged');
  const idxCommit = args.indexOf('--commit');
  const idxFiles = args.indexOf('--files');

  if (idxFiles >= 0) {
    return args.slice(idxFiles + 1);
  }
  if (idxStaged >= 0) {
    return execSync('git diff --cached --name-only', { cwd: REPO_ROOT, encoding: 'utf8' })
      .split('\n').filter(Boolean);
  }
  if (idxCommit >= 0) {
    const ref = args[idxCommit + 1] ?? 'HEAD';
    return execSync(`git diff-tree --no-commit-id --name-only -r ${ref}`, { cwd: REPO_ROOT, encoding: 'utf8' })
      .split('\n').filter(Boolean);
  }
  // Default: working tree changes (incluindo unstaged)
  return execSync('git diff --name-only HEAD', { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean);
}

function main() {
  const config = loadConfig();
  const allowed = (config.boundaries?.allowed_write_paths ?? []).map(globToRegex);
  const forbidden = (config.boundaries?.forbidden_write_paths ?? []).map(globToRegex);

  const files = getChangedFiles(process.argv.slice(2));
  if (files.length === 0) {
    console.log('[boundaries-check] nenhum arquivo modificado — OK');
    process.exit(0);
  }

  const violations = [];
  for (const file of files) {
    // Forbidden tem precedencia: se bate em qualquer forbidden, viola.
    if (forbidden.some((re) => re.test(file))) {
      violations.push({ file, reason: 'em forbidden_write_paths' });
      continue;
    }
    // Allowed: tem que bater em pelo menos um pattern.
    if (!allowed.some((re) => re.test(file))) {
      violations.push({ file, reason: 'fora de allowed_write_paths' });
    }
  }

  if (violations.length > 0) {
    console.error('[boundaries-check] VIOLATIONS:');
    for (const v of violations) {
      console.error(`  ✗ ${v.file} — ${v.reason}`);
    }
    console.error(`\nTotal: ${violations.length}/${files.length} arquivos violam boundaries.`);
    console.error('A routine blog-daily nao pode commitar fora da allowlist.');
    process.exit(1);
  }

  console.log(`[boundaries-check] ${files.length} arquivos verificados — OK`);
  process.exit(0);
}

main();
