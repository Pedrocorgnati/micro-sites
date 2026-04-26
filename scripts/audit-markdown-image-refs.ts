/**
 * Audit refs de imagens em markdown — falha se imagem referenciada nao existe.
 *
 * Glob: sites/*\/blog/**\/*.md + sites/*\/content/**\/*.md
 *
 * Suporta:
 *   - ![alt](path) — markdown standard
 *   - <img src="path">
 *   - <Image src="path"> (next/image em MDX)
 *
 * Resolve path relativo ao site (sites/{slug}/public/) ou public/ root.
 *
 * TASK-15 ST003 — gap CL-095
 *
 * Usage:
 *   npx tsx scripts/audit-markdown-image-refs.ts [--site <slug>]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const SITES_DIR = path.join(ROOT, 'sites');
const PUBLIC_ROOT = path.join(ROOT, 'public');
const SITE_FILTER = (() => {
  const i = process.argv.indexOf('--site');
  return i >= 0 ? process.argv[i + 1] : null;
})();

interface Finding {
  site: string;
  file: string;
  line: number;
  reference: string;
  resolved: string[];
  reason: string;
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...walkMarkdown(p));
    } else if (e.name.endsWith('.md') || e.name.endsWith('.mdx')) {
      out.push(p);
    }
  }
  return out;
}

function extractRefs(content: string): Array<{ ref: string; line: number }> {
  const lines = content.split('\n');
  const refs: Array<{ ref: string; line: number }> = [];
  const patterns = [
    /!\[[^\]]*\]\(([^)]+)\)/g,
    /<img[^>]*\bsrc=["']([^"']+)["'][^>]*\/?>/gi,
    /<Image[^>]*\bsrc=["']([^"']+)["'][^>]*\/?>/g,
  ];
  for (let i = 0; i < lines.length; i++) {
    for (const p of patterns) {
      let m: RegExpExecArray | null;
      const re = new RegExp(p);
      while ((m = re.exec(lines[i])) !== null) {
        const ref = m[1].split(' ')[0]; // strip title
        refs.push({ ref, line: i + 1 });
      }
    }
  }
  return refs;
}

function isExternalOrData(ref: string): boolean {
  return /^(https?:|data:|\/\/)/.test(ref) || ref.startsWith('mailto:') || ref.startsWith('#');
}

function resolveRef(ref: string, mdFile: string, siteSlug: string): { found: string | null; tried: string[] } {
  const tried: string[] = [];
  const cleanRef = ref.startsWith('/') ? ref.slice(1) : ref;

  const candidates = [
    path.join(SITES_DIR, siteSlug, 'public', cleanRef),
    path.join(SITES_DIR, siteSlug, cleanRef),
    path.join(PUBLIC_ROOT, cleanRef),
    path.resolve(path.dirname(mdFile), ref),
  ];
  for (const c of candidates) {
    tried.push(c);
    if (fs.existsSync(c)) return { found: c, tried };
  }
  return { found: null, tried };
}

function main(): void {
  if (!fs.existsSync(SITES_DIR)) {
    console.warn('[audit-md-img] sites/ nao existe');
    process.exit(0);
  }

  const findings: Finding[] = [];
  const slugs = fs
    .readdirSync(SITES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .filter((s) => !SITE_FILTER || s === SITE_FILTER);

  for (const slug of slugs) {
    const siteDir = path.join(SITES_DIR, slug);
    const blogDir = path.join(siteDir, 'blog');
    const contentDir = path.join(siteDir, 'content');
    const mdFiles = [...walkMarkdown(blogDir), ...walkMarkdown(contentDir)];

    for (const f of mdFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const refs = extractRefs(content);
      for (const r of refs) {
        if (isExternalOrData(r.ref)) continue;
        const { found, tried } = resolveRef(r.ref, f, slug);
        if (!found) {
          findings.push({
            site: slug,
            file: path.relative(ROOT, f),
            line: r.line,
            reference: r.ref,
            resolved: tried.slice(0, 3).map((p) => path.relative(ROOT, p)),
            reason: 'imagem referenciada nao existe em nenhum dos paths esperados',
          });
        }
      }
    }
  }

  if (findings.length === 0) {
    console.log(`[audit-md-img] OK — ${slugs.length} sites verificados, sem refs quebradas`);
    process.exit(0);
  }

  console.error(`[audit-md-img] FAIL — ${findings.length} refs quebradas:`);
  for (const f of findings) {
    console.error(`  ${f.site}: ${f.file}:${f.line} -> '${f.reference}'`);
    console.error(`    tentou: ${f.resolved.join(', ')}`);
  }
  console.error('');
  console.error('Acao: criar a imagem em sites/{slug}/public/ ou remover a referencia.');
  process.exit(1);
}

main();
