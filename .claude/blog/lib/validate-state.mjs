#!/usr/bin/env node
/**
 * Blog Daily — CLI wrapper para validacoes de estado.
 *
 * Uso:
 *   node .claude/blog/lib/validate-state.mjs            # full check (groups + queues + ledgers)
 *   node .claude/blog/lib/validate-state.mjs --groups   # so groups integrity
 *   node .claude/blog/lib/validate-state.mjs --queues   # so queue.json por grupo
 *   node .claude/blog/lib/validate-state.mjs --ledgers  # so registry/canonical-map/slug-history
 *
 * Exit: 0 = OK, 1 = falha (lista detalhes em stderr).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname_resolved = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname_resolved, '..', '..', '..');

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); console.error(`✗ ${msg}`); }
function warn(msg) { warnings.push(msg); console.warn(`⚠ ${msg}`); }
function ok(msg) { console.log(`✓ ${msg}`); }

function loadJson(p, label) {
  if (!fs.existsSync(p)) { err(`${label}: ausente em ${p}`); return null; }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { err(`${label}: JSON invalido — ${e.message}`); return null; }
}

function validateGroups() {
  const cfg = loadJson(path.join(REPO_ROOT, '.claude/blog/config.json'), 'config.json');
  const groups = loadJson(path.join(REPO_ROOT, '.claude/blog/data/global/groups.json'), 'groups.json');
  if (!cfg || !groups) return;

  // Hash check (EOL-normalized)
  const raw = fs.readFileSync(path.join(REPO_ROOT, '.claude/blog/data/global/groups.json'), 'utf8');
  const normalized = raw.replace(/\r\n/g, '\n');
  const actualHash = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  if (actualHash !== cfg.expected_groups_hash) {
    err(`groups.json hash mismatch — actual=${actualHash.slice(0, 16)}... expected=${cfg.expected_groups_hash.slice(0, 16)}...`);
    return;
  }

  // 6×6 invariants
  if (groups.groups?.length !== 6) { err(`esperado 6 grupos, ${groups.groups?.length}`); return; }
  if (groups.groups_count !== 6 || groups.sites_count !== 36) {
    err(`headers stale — groups_count=${groups.groups_count} sites_count=${groups.sites_count}`);
    return;
  }
  const ids = groups.groups.map((g) => g.id).sort();
  const expected = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    err(`IDs invalidos: ${ids.join(',')}`); return;
  }
  for (const g of groups.groups) {
    if (g.siteSlugs.length !== 6) { err(`${g.id}: ${g.siteSlugs.length} sites`); return; }
    if (!g.siteSlugs.includes(g.hubSlug)) { err(`${g.id}: hub ${g.hubSlug} fora siteSlugs`); return; }
  }
  const allSlugs = groups.groups.flatMap((g) => g.siteSlugs);
  if (new Set(allSlugs).size !== 36) { err(`slugs duplicados`); return; }

  ok('groups.json: 6×6, hash OK, IDs unicos');
}

function validateQueues() {
  const groupsFile = path.join(REPO_ROOT, '.claude/blog/data/global/groups.json');
  const groups = loadJson(groupsFile, 'groups.json');
  if (!groups) return;

  for (const g of groups.groups) {
    const queueFile = path.join(REPO_ROOT, '.claude/blog/data/groups', g.id, 'prioritized-topics', 'queue.json');
    if (!fs.existsSync(queueFile)) {
      warn(`${g.id}: queue.json ausente — gerar via /blog:expand-keywords --group ${g.id}`);
      continue;
    }
    const q = loadJson(queueFile, `${g.id}/queue.json`);
    if (!q) continue;
    if (!Array.isArray(q.queue) || q.queue.length === 0) {
      err(`${g.id}/queue.json: queue vazia`);
      continue;
    }
    if (q.queue.length < 5) {
      warn(`${g.id}: queue baixa (${q.queue.length} itens) — recomendado >= 30`);
    }
    ok(`${g.id}/queue.json: ${q.queue.length} topics`);
  }
}

function bootstrapLedgers() {
  const ledgers = [
    {
      file: '.claude/blog/data/global/registry.json',
      initial: {
        lastUpdated: new Date().toISOString(),
        storiesPublished: 0,
        storiesByGroup: { G1: 0, G2: 0, G3: 0, G4: 0, G5: 0, G6: 0 },
        siteSlugCounts: {},
        canonicalMap: {},
      },
    },
    {
      file: '.claude/blog/data/global/canonical-map.json',
      initial: {},
    },
    {
      file: '.claude/blog/data/global/slug-history.jsonl',
      initial: '',
      isJsonl: true,
    },
  ];

  for (const l of ledgers) {
    const p = path.join(REPO_ROOT, l.file);
    if (!fs.existsSync(p)) {
      const content = l.isJsonl ? l.initial : JSON.stringify(l.initial, null, 2) + '\n';
      fs.writeFileSync(p, content, 'utf8');
      ok(`bootstrapped ${l.file}`);
    } else {
      ok(`${l.file} ja existe`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const all = args.length === 0;
  if (all || args.includes('--groups')) validateGroups();
  if (all || args.includes('--queues')) validateQueues();
  if (all || args.includes('--ledgers')) bootstrapLedgers();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (errors.length > 0) {
    console.error(`validate-state: FAIL — ${errors.length} erro(s), ${warnings.length} aviso(s)`);
    process.exit(1);
  }
  console.log(`validate-state: OK — ${warnings.length} aviso(s)`);
  process.exit(0);
}

main();
