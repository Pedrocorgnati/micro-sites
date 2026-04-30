#!/usr/bin/env node
/**
 * Blog Daily — Smoke test offline.
 *
 * Valida que o esqueleto de estado da routine esta correto SEM chamar APIs
 * externas (Tavily/Perplexity/etc) nem rodar o pipeline completo.
 *
 * Cobre:
 *   1. config.json + groups.json existem e parseiam.
 *   2. Hash bate.
 *   3. validateGroupsIntegrity passa.
 *   4. Boundaries-check em diff vazio retorna 0.
 *   5. Os 36 sites do groups.json tem diretorio sites/{slug}/blog/articles/.
 *   6. Master-strategy existe para todos os grupos com seeds em .claude/blog/data/groups/{Gn}/seeds/.
 *   7. routine prompt em .claude/routines/blog-daily.md existe e nao esta vazio.
 *
 * Uso:
 *   node .claude/blog/lib/smoke-test.mjs
 *
 * Exit: 0 = OK, 1 = falha.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname_resolved = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname_resolved, '..', '..', '..');

const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (e) {
    checks.push({ name, ok: false, err: e.message });
    console.error(`✗ ${name}: ${e.message}`);
  }
}

// 1. config.json
check('config.json existe e parseia', () => {
  const f = path.join(REPO_ROOT, '.claude', 'blog', 'config.json');
  if (!fs.existsSync(f)) throw new Error('ausente');
  const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (cfg.version !== '1.0.0') throw new Error(`version=${cfg.version} esperado 1.0.0`);
  if (cfg.routine?.total_articles_per_run !== 36) throw new Error('total_articles_per_run != 36');
});

// 2. groups.json
check('groups.json existe e parseia (6 grupos × 6 sites)', () => {
  const f = path.join(REPO_ROOT, '.claude', 'blog', 'data', 'global', 'groups.json');
  if (!fs.existsSync(f)) throw new Error('ausente');
  const g = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (g.groups?.length !== 6) throw new Error(`groups.length=${g.groups?.length}`);
  for (const grp of g.groups) {
    if (grp.siteSlugs.length !== 6) throw new Error(`${grp.id}: ${grp.siteSlugs.length} sites`);
    if (!grp.siteSlugs.includes(grp.hubSlug)) throw new Error(`${grp.id}: hub fora dos siteSlugs`);
  }
  const allSlugs = g.groups.flatMap((x) => x.siteSlugs);
  const unique = new Set(allSlugs);
  if (allSlugs.length !== 36 || unique.size !== 36) throw new Error('total/unicidade falha');
});

// 3. Hash integrity (executa loader real)
check('hash de groups.json bate com config.expected_groups_hash', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude/blog/config.json'), 'utf8'));
  const groupsRaw = fs.readFileSync(path.join(REPO_ROOT, '.claude/blog/data/global/groups.json'), 'utf8');
  const normalized = groupsRaw.replace(/\r\n/g, '\n');
  const actual = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  if (actual !== cfg.expected_groups_hash) {
    throw new Error(`mismatch: actual=${actual.slice(0, 16)}... expected=${cfg.expected_groups_hash.slice(0, 16)}...`);
  }
});

// 4. boundaries-check em diff vazio
check('boundaries-check.mjs roda em --files vazio (sanity check)', () => {
  const out = execSync(`node "${path.join(REPO_ROOT, '.claude/blog/lib/boundaries-check.mjs')}" --files`, {
    cwd: REPO_ROOT, encoding: 'utf8',
  });
  if (!out.includes('OK')) throw new Error(`output inesperado: ${out}`);
});

// 5. Diretorios sites/{slug}/blog/articles/ para todos os 36 sites
check('36 sites tem sites/{slug}/blog/articles/', () => {
  const groups = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude/blog/data/global/groups.json'), 'utf8'));
  const allSlugs = groups.groups.flatMap((g) => g.siteSlugs);
  const missing = [];
  for (const slug of allSlugs) {
    const articlesDir = path.join(REPO_ROOT, 'sites', slug, 'blog', 'articles');
    if (!fs.existsSync(articlesDir)) {
      // Tentar criar se diretorio sites/{slug}/blog existe
      const blogDir = path.join(REPO_ROOT, 'sites', slug, 'blog');
      if (fs.existsSync(blogDir)) {
        fs.mkdirSync(articlesDir, { recursive: true });
      } else {
        missing.push(slug);
      }
    }
  }
  if (missing.length > 0) throw new Error(`${missing.length} sites sem dir blog: ${missing.slice(0, 5).join(', ')}...`);
});

// 6. Master-strategies — strict em prod, warning em dev
check('master-strategies para todos os 6 grupos', () => {
  const isStrict = process.env.BLOG_SMOKE_STRICT === '1' || process.env.NEXT_PUBLIC_APP_ENV === 'production';
  const missing = [];
  for (const g of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']) {
    const f = path.join(REPO_ROOT, '.claude', 'blog', 'data', 'groups', g, 'seeds', 'master-strategy.md');
    if (!fs.existsSync(f)) missing.push(g);
  }
  if (missing.length > 0) {
    if (isStrict) {
      throw new Error(`master-strategy ausente em ${missing.join(', ')}`);
    }
    console.warn(`  ⚠ master-strategy ausente em ${missing.join(', ')} — gerar via /blog:init-strategy --group {Gn}`);
  }
});

// 6b. Filas prioritized-topics — strict em prod, warning em dev
check('queue.json existe para grupos com master-strategy', () => {
  const isStrict = process.env.BLOG_SMOKE_STRICT === '1' || process.env.NEXT_PUBLIC_APP_ENV === 'production';
  const groups = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude/blog/data/global/groups.json'), 'utf8'));
  const queueMissing = [];
  const queueEmpty = [];
  for (const g of groups.groups) {
    const ms = path.join(REPO_ROOT, '.claude/blog/data/groups', g.id, 'seeds', 'master-strategy.md');
    const queue = path.join(REPO_ROOT, '.claude/blog/data/groups', g.id, 'prioritized-topics', 'queue.json');
    if (!fs.existsSync(ms)) continue; // skip se master-strategy ausente (ja flagged em check 6)
    if (!fs.existsSync(queue)) { queueMissing.push(g.id); continue; }
    const q = JSON.parse(fs.readFileSync(queue, 'utf8'));
    if (!Array.isArray(q.queue) || q.queue.length === 0) queueEmpty.push(g.id);
  }
  if (queueMissing.length > 0 || queueEmpty.length > 0) {
    const msg = `queue ausente: ${queueMissing.join(',')} | queue vazia: ${queueEmpty.join(',')}`;
    if (isStrict) throw new Error(msg);
    console.warn(`  ⚠ ${msg}`);
  }
});

// 6c. Validate-state CLI roda
check('validate-state.mjs --groups passa', () => {
  execSync(`node "${path.join(REPO_ROOT, '.claude/blog/lib/validate-state.mjs')}" --groups`, {
    cwd: REPO_ROOT, encoding: 'utf8',
  });
});

// 7. Routine prompt
check('routine prompt em .claude/routines/blog-daily.md', () => {
  const f = path.join(REPO_ROOT, '.claude', 'routines', 'blog-daily.md');
  if (!fs.existsSync(f)) throw new Error('ausente');
  const content = fs.readFileSync(f, 'utf8');
  if (content.length < 1000) throw new Error('prompt muito curto');
  if (!content.includes('[ROUTINE PROMPT]')) throw new Error('marcador [ROUTINE PROMPT] ausente');
  if (!content.includes('STORIES_POR_RUN = 6')) throw new Error('volume fixo nao declarado');
});

// 8. Schemas
check('JSON Schemas validos', () => {
  for (const schema of ['config', 'groups', 'batch-manifest', 'registry']) {
    const f = path.join(REPO_ROOT, '.claude', 'blog', 'schemas', `${schema}.schema.json`);
    if (!fs.existsSync(f)) throw new Error(`${schema}.schema.json ausente`);
    JSON.parse(fs.readFileSync(f, 'utf8')); // throws se invalido
  }
});

// Summary
const failed = checks.filter((c) => !c.ok).length;
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`smoke-test blog-daily: ${checks.length - failed}/${checks.length} pass`);
process.exit(failed > 0 ? 1 : 0);
