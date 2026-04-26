#!/usr/bin/env tsx
/**
 * Injeta `slug` no frontmatter de artigos que NÃO têm slug.
 * Deriva slug do filename (sem `.md`) — já está em kebab-case por convenção.
 *
 * Regras (Codex adversarial review sess-20260424-m8-corrective-plan):
 *  - NUNCA sobrescreve slug existente.
 *  - Detecta colisão intra-site (2 arquivos derivariam mesmo slug) e aborta.
 *  - Colisão entre sites diferentes é aceitável (roteamento é por site).
 *  - Manipulação direta do bloco frontmatter (preserva formatação YAML).
 *
 * Uso:
 *   npm run fix:slugs -- --dry-run   # imprime os diffs propostos
 *   npm run fix:slugs -- --apply     # escreve
 *   npm run fix:slugs -- --apply --site a05   # restringe a 1 site
 *
 * Fonte: TASK-5 ST002 (module-11-blog-pipeline — M8/G-002 remediation)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const SITES_DIR = path.join(process.cwd(), 'sites');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !args.includes('--apply');
const siteIdx = args.indexOf('--site');
const siteFilter = siteIdx !== -1 ? args[siteIdx + 1] : undefined;

const SLUG_REGEX = /^[a-z0-9-]+$/;
const FRONTMATTER_DELIM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

type Candidate = {
  site: string;
  file: string;
  filePath: string;
  currentSlug: string | null;
  derivedSlug: string;
  action: 'INJECT' | 'SKIP-HAS-SLUG' | 'ERROR-INVALID-SLUG';
  reason?: string;
};

function parseFrontmatter(raw: string): { block: string; rest: string } | null {
  const m = raw.match(FRONTMATTER_DELIM);
  if (!m) return null;
  return { block: m[1], rest: raw.slice(m[0].length) };
}

function extractCurrentSlug(block: string): string | null {
  // Procura linha começando com `slug:` (não indentada — topo do objeto)
  const m = block.match(/^slug:\s*(.*?)\s*$/m);
  if (!m) return null;
  // Remove aspas simples/duplas se presentes
  const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
  return raw.length > 0 ? raw : null;
}

function deriveSlug(file: string): string {
  return file.replace(/\.md$/, '');
}

function buildUpdatedFrontmatter(block: string, slug: string): string {
  // Insere `slug: {value}` como PRIMEIRA chave do frontmatter
  // (convenção do projeto — ver d01/artigo-antigo.md)
  const quoted = SLUG_REGEX.test(slug) ? slug : `'${slug}'`;
  return `slug: ${quoted}\n${block}`;
}

function writeUpdated(filePath: string, raw: string, newBlock: string): void {
  const replaced = raw.replace(FRONTMATTER_DELIM, `---\n${newBlock}\n---\n`);
  writeFileSync(filePath, replaced, 'utf-8');
}

// ========== scan ==========

if (!existsSync(SITES_DIR)) {
  console.error(`✗ Diretório sites/ não encontrado em ${SITES_DIR}`);
  process.exit(1);
}

const candidates: Candidate[] = [];
const sitesToScan = siteFilter ? [siteFilter] : readdirSync(SITES_DIR).sort();

for (const site of sitesToScan) {
  const blogDir = path.join(SITES_DIR, site, 'blog', 'articles');
  if (!existsSync(blogDir)) continue;
  const files = readdirSync(blogDir).filter((f) => f.endsWith('.md')).sort();

  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(raw);
    if (!fm) {
      candidates.push({
        site,
        file,
        filePath,
        currentSlug: null,
        derivedSlug: deriveSlug(file),
        action: 'ERROR-INVALID-SLUG',
        reason: 'frontmatter-missing',
      });
      continue;
    }
    const current = extractCurrentSlug(fm.block);
    const derived = deriveSlug(file);

    if (current !== null) {
      candidates.push({
        site,
        file,
        filePath,
        currentSlug: current,
        derivedSlug: derived,
        action: 'SKIP-HAS-SLUG',
      });
      continue;
    }

    if (!SLUG_REGEX.test(derived)) {
      candidates.push({
        site,
        file,
        filePath,
        currentSlug: null,
        derivedSlug: derived,
        action: 'ERROR-INVALID-SLUG',
        reason: `filename "${file}" não produz slug kebab-case válido`,
      });
      continue;
    }

    candidates.push({
      site,
      file,
      filePath,
      currentSlug: null,
      derivedSlug: derived,
      action: 'INJECT',
    });
  }
}

// ========== collision detection (intra-site only) ==========

const toInject = candidates.filter((c) => c.action === 'INJECT');

const intraSiteSlugs: Record<string, string[]> = {};
for (const c of candidates) {
  // Olhar slug atual OU slug derivado (para injetados) — ver colisão entre existentes + novos
  const slugToCheck = c.currentSlug ?? (c.action === 'INJECT' ? c.derivedSlug : null);
  if (!slugToCheck) continue;
  const key = `${c.site}::${slugToCheck}`;
  (intraSiteSlugs[key] = intraSiteSlugs[key] ?? []).push(c.file);
}

const collisions = Object.entries(intraSiteSlugs)
  .filter(([, files]) => files.length > 1)
  .map(([key, files]) => ({ key, files }));

// ========== output ==========

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`INJECT MISSING SLUGS — ${isDryRun ? 'DRY-RUN' : 'APPLY'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total escaneado:       ${candidates.length}`);
console.log(`A injetar:             ${toInject.length}`);
console.log(`Ja tem slug (SKIP):    ${candidates.filter((c) => c.action === 'SKIP-HAS-SLUG').length}`);
console.log(`Com erro:              ${candidates.filter((c) => c.action === 'ERROR-INVALID-SLUG').length}`);
console.log(`Colisoes intra-site:   ${collisions.length}`);
console.log('');

if (collisions.length > 0) {
  console.error('✗ COLISOES INTRA-SITE DETECTADAS:');
  for (const { key, files } of collisions) {
    console.error(`  ${key}`);
    for (const f of files) console.error(`    - ${f}`);
  }
  console.error('\nAbortando. Resolva as colisoes manualmente antes de prosseguir.');
  process.exit(2);
}

const errors = candidates.filter((c) => c.action === 'ERROR-INVALID-SLUG');
if (errors.length > 0) {
  console.warn(`\n⚠ ${errors.length} arquivo(s) com problema estrutural:`);
  for (const e of errors) console.warn(`  ${e.site}/${e.file}: ${e.reason}`);
  console.warn('(prosseguindo apenas com os INJECT)\n');
}

if (toInject.length === 0) {
  console.log('Nada para injetar. Todos os artigos ja tem slug.');
  process.exit(0);
}

console.log('ARTIGOS A INJETAR:');
for (const c of toInject) {
  console.log(`  ${c.site}/${c.file}  →  slug: ${c.derivedSlug}`);
}
console.log('');

if (isDryRun) {
  console.log('(dry-run — nenhum arquivo modificado)');
  console.log('Para aplicar: npm run fix:slugs -- --apply');
  process.exit(0);
}

// apply
let applied = 0;
for (const c of toInject) {
  const raw = readFileSync(c.filePath, 'utf-8');
  const fm = parseFrontmatter(raw);
  if (!fm) continue;
  const newBlock = buildUpdatedFrontmatter(fm.block, c.derivedSlug);
  writeUpdated(c.filePath, raw, newBlock);
  applied++;
}

console.log(`✅ Aplicado em ${applied} arquivo(s).`);
process.exit(0);
