#!/usr/bin/env tsx
/**
 * Injeta `description` no frontmatter de artigos que NÃO têm description.
 * Deriva a partir do primeiro parágrafo do body, truncando para 50-155 chars.
 *
 * Regras (Codex adversarial review sess-20260424-m8-corrective-plan):
 *  - NUNCA sobrescreve description existente.
 *  - Extrai primeiro parágrafo não-vazio, remove markdown básico.
 *  - Se >155 chars → corta na última palavra antes de 150 + "...".
 *  - Se <50 chars após extrair 1º parágrafo → concatena 2º parágrafo.
 *  - Se ainda <50 chars → marca como MANUAL e não escreve (reporta ao usuário).
 *
 * Uso:
 *   npm run fix:descriptions -- --dry-run
 *   npm run fix:descriptions -- --apply
 *
 * Fonte: TASK-5 ST003 (module-11-blog-pipeline — M8/G-002 remediation)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const SITES_DIR = path.join(process.cwd(), 'sites');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !args.includes('--apply');

const FRONTMATTER_DELIM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const DESC_MIN = 50;
const DESC_MAX = 155;
const DESC_SOFT_CAP = 150; // deixa 5 chars de folga para "..."

type Candidate = {
  site: string;
  file: string;
  filePath: string;
  action: 'INJECT' | 'SKIP-HAS-DESC' | 'SKIP-MANUAL' | 'ERROR';
  proposedDescription?: string;
  reason?: string;
};

function parseFrontmatter(raw: string): { block: string; body: string; matchEnd: number } | null {
  const m = raw.match(FRONTMATTER_DELIM);
  if (!m) return null;
  return { block: m[1], body: raw.slice(m[0].length), matchEnd: m[0].length };
}

function hasDescription(block: string): boolean {
  // Considera presente se houver linha `description:` com valor (inclusive multi-line `>-`)
  const m = block.match(/^description:\s*(.*?)\s*$/m);
  if (!m) return false;
  const value = m[1].trim();
  // vazio literal ou só `>-` (prefixo YAML multi-line) não conta como presente
  if (value === '' || value === '|' || value === '>' || value === '>-' || value === '|-') {
    // Para multi-line, precisamos checar se há linhas indentadas após
    const multilineMatch = block.match(/^description:\s*[|>]-?\s*\n((?:\s{2,}.*(?:\n|$))+)/m);
    if (multilineMatch) return multilineMatch[1].trim().length > 0;
    return false;
  }
  return value.length > 0;
}

function stripMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // ![alt](url) -> alt
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** -> bold
    .replace(/__([^_]+)__/g, '$1') // __bold__ -> bold
    .replace(/\*([^*]+)\*/g, '$1') // *italic* -> italic
    .replace(/_([^_]+)_/g, '$1') // _italic_ -> italic
    .replace(/`([^`]+)`/g, '$1') // `code` -> code
    .replace(/~~([^~]+)~~/g, '$1') // ~~strike~~ -> strike
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFirstParagraphs(body: string): string[] {
  const lines = body.split(/\r?\n/);
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    } else if (/^#{1,6}\s/.test(trimmed)) {
      // heading — flush e skip
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    } else if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      // lista — flush e skip
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    } else if (/^>/.test(trimmed) || /^```/.test(trimmed)) {
      // blockquote ou code fence — flush e skip
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    } else {
      current.push(trimmed);
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' '));
  return paragraphs.map(stripMarkdown).filter((p) => p.length > 0);
}

function buildDescription(body: string): { ok: boolean; value?: string; reason?: string } {
  const paragraphs = extractFirstParagraphs(body);
  if (paragraphs.length === 0) {
    return { ok: false, reason: 'nenhum paragrafo extraivel do body' };
  }

  let candidate = paragraphs[0];
  if (candidate.length < DESC_MIN && paragraphs.length > 1) {
    candidate = `${paragraphs[0]} ${paragraphs[1]}`;
  }

  if (candidate.length < DESC_MIN) {
    return { ok: false, reason: `texto extraido tem ${candidate.length} chars (min ${DESC_MIN})` };
  }

  if (candidate.length > DESC_MAX) {
    // corta na última palavra antes do soft cap + "..."
    const slice = candidate.slice(0, DESC_SOFT_CAP);
    const lastSpace = slice.lastIndexOf(' ');
    const truncated = (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).replace(/[.,;:!?]+$/, '');
    candidate = `${truncated}...`;
  }

  if (candidate.length < DESC_MIN || candidate.length > DESC_MAX) {
    return { ok: false, reason: `tamanho final ${candidate.length} fora de [${DESC_MIN},${DESC_MAX}]` };
  }
  return { ok: true, value: candidate };
}

function injectDescription(block: string, description: string): string {
  // Escape de aspas simples e escapa como YAML single-quote string
  const yamlEscaped = description.replace(/'/g, "''");
  // Inserir após a linha de title (se houver) ou após slug (se houver) ou no topo
  const lines = block.split(/\r?\n/);
  let insertAt = 0;
  const anchors = ['title:', 'slug:'];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (anchors.some((a) => l.startsWith(a))) {
      // avançar até o próximo "top-level" key ou fim
      insertAt = i + 1;
      // lidar com multi-line (linhas indentadas são continuação)
      while (insertAt < lines.length && /^\s{2,}/.test(lines[insertAt])) insertAt++;
    }
  }
  lines.splice(insertAt, 0, `description: '${yamlEscaped}'`);
  return lines.join('\n');
}

// ========== scan ==========

if (!existsSync(SITES_DIR)) {
  console.error(`✗ Diretório sites/ não encontrado em ${SITES_DIR}`);
  process.exit(1);
}

const candidates: Candidate[] = [];

for (const site of readdirSync(SITES_DIR).sort()) {
  const blogDir = path.join(SITES_DIR, site, 'blog', 'articles');
  if (!existsSync(blogDir)) continue;
  const files = readdirSync(blogDir).filter((f) => f.endsWith('.md')).sort();

  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(raw);
    if (!fm) {
      candidates.push({ site, file, filePath, action: 'ERROR', reason: 'frontmatter-missing' });
      continue;
    }
    if (hasDescription(fm.block)) {
      candidates.push({ site, file, filePath, action: 'SKIP-HAS-DESC' });
      continue;
    }
    const result = buildDescription(fm.body);
    if (!result.ok) {
      candidates.push({ site, file, filePath, action: 'SKIP-MANUAL', reason: result.reason });
      continue;
    }
    candidates.push({
      site,
      file,
      filePath,
      action: 'INJECT',
      proposedDescription: result.value,
    });
  }
}

const toInject = candidates.filter((c) => c.action === 'INJECT');
const manuals = candidates.filter((c) => c.action === 'SKIP-MANUAL');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`INJECT MISSING DESCRIPTIONS — ${isDryRun ? 'DRY-RUN' : 'APPLY'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total escaneado:       ${candidates.length}`);
console.log(`A injetar:             ${toInject.length}`);
console.log(`Ja tem description:    ${candidates.filter((c) => c.action === 'SKIP-HAS-DESC').length}`);
console.log(`Precisam manual:       ${manuals.length}`);
console.log(`Com erro:              ${candidates.filter((c) => c.action === 'ERROR').length}`);
console.log('');

if (manuals.length > 0) {
  console.warn('⚠ Arquivos que NAO podem ter description auto-derivada:');
  for (const m of manuals) console.warn(`  ${m.site}/${m.file}: ${m.reason}`);
  console.warn('(esses ficam para TASK-6 editorial)\n');
}

if (toInject.length === 0) {
  console.log('Nada para injetar.');
  process.exit(0);
}

console.log('ARTIGOS A INJETAR:');
for (const c of toInject) {
  const preview = c.proposedDescription!.length > 80 ? `${c.proposedDescription!.slice(0, 77)}...` : c.proposedDescription;
  console.log(`  ${c.site}/${c.file}  (${c.proposedDescription!.length} chars)`);
  console.log(`    → "${preview}"`);
}
console.log('');

if (isDryRun) {
  console.log('(dry-run — nenhum arquivo modificado)');
  console.log('Para aplicar: npm run fix:descriptions -- --apply');
  process.exit(0);
}

// apply
let applied = 0;
for (const c of toInject) {
  const raw = readFileSync(c.filePath, 'utf-8');
  const fm = parseFrontmatter(raw);
  if (!fm) continue;
  const newBlock = injectDescription(fm.block, c.proposedDescription!);
  const replaced = raw.replace(FRONTMATTER_DELIM, `---\n${newBlock}\n---\n`);
  writeFileSync(c.filePath, replaced, 'utf-8');
  applied++;
}

console.log(`✅ Aplicado em ${applied} arquivo(s).`);
process.exit(0);
