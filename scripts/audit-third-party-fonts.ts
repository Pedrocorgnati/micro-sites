/**
 * audit-third-party-fonts — audita dist/ para refs a CDN de fontes terceiras.
 *
 * Procura em todos os HTML/CSS de dist/{slug}/ por:
 *   - fonts.gstatic.com (CDN do Google Fonts)
 *   - fonts.googleapis.com (importer)
 *   - use.typekit.net (Adobe)
 *   - cdn.jsdelivr.net/.../font (jsDelivr fonts)
 *
 * Embora `next/font/google` da Next.js auto-self-hospede em build time
 * (sem chamada runtime ao Google), este audit confirma que nenhum CSS
 * customizado adicionado em sites/{slug}/ esta puxando do CDN.
 *
 * TASK-25 ST001 / CL-376 — falha build se detectar (CI gate).
 *
 * Usage:
 *   npx tsx scripts/audit-third-party-fonts.ts [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const STRICT = process.argv.includes('--strict');

const FORBIDDEN_PATTERNS = [
  /fonts\.gstatic\.com/i,
  /fonts\.googleapis\.com/i,
  /use\.typekit\.net/i,
  /cdn\.jsdelivr\.net\/[^"']*\.(woff2?|ttf|otf)/i,
  /unpkg\.com\/[^"']*\.(woff2?|ttf|otf)/i,
];

interface Hit {
  file: string;
  line: number;
  pattern: string;
  snippet: string;
}

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

function main(): void {
  if (!fs.existsSync(DIST)) {
    console.warn('[third-party-fonts] dist/ ausente — rodar build antes');
    process.exit(0);
  }

  const files = [...walk(DIST, ['.html', '.css', '.js'])];
  const hits: Hit[] = [];

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const re of FORBIDDEN_PATTERNS) {
        if (re.test(lines[i])) {
          hits.push({
            file: path.relative(path.resolve('.'), f),
            line: i + 1,
            pattern: re.source,
            snippet: lines[i].trim().slice(0, 120),
          });
        }
      }
    }
  }

  if (hits.length === 0) {
    console.log(`[third-party-fonts] OK — ${files.length} arquivos auditados, zero refs a CDN externo`);
    process.exit(0);
  }

  console.error(`[third-party-fonts] FAIL — ${hits.length} refs detectadas:`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line} <${h.pattern}>`);
    console.error(`    > ${h.snippet}`);
  }
  console.error('');
  console.error('Acao: substituir por self-host (next/font/local) ou next/font/google (que self-hospeda em build).');
  if (STRICT) process.exit(1);
}

main();
