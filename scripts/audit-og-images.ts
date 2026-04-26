/**
 * audit-og-images — verifica que cada dist/{slug}/ tem og-image.png valida.
 *
 * Critically:
 *   - Existe?
 *   - Tem dimensoes >= 1200x630? (verificacao via header PNG IHDR — sem deps)
 *   - Tamanho minimo 5KB (PNG vazio gerado por erro tipico tem <2KB)
 *
 * TASK-16 ST003 — gap CL-103
 *
 * Usage:
 *   npx tsx scripts/audit-og-images.ts [--site <slug>]
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const SITE_FILTER = (() => {
  const i = process.argv.indexOf('--site');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const REQUIRED_WIDTH = 1200;
const REQUIRED_HEIGHT = 630;
const MIN_BYTES = 5 * 1024;

interface Issue {
  slug: string;
  reason: string;
}

function readPngDimensions(file: string): { width: number; height: number } | null {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    // PNG magic 89 50 4E 47 0D 0A 1A 0A + IHDR length(4) + 'IHDR'(4) + width(4) + height(4)
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    if (!isPng) return null;
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  } catch {
    return null;
  }
}

function main(): void {
  if (!fs.existsSync(DIST)) {
    console.warn('[audit-og] dist/ nao existe — rodar build antes');
    process.exit(0);
  }

  const slugs = fs
    .readdirSync(DIST, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((s) => !SITE_FILTER || s === SITE_FILTER);

  const issues: Issue[] = [];

  for (const slug of slugs) {
    const og = path.join(DIST, slug, 'og-image.png');
    if (!fs.existsSync(og)) {
      issues.push({ slug, reason: `og-image.png ausente em dist/${slug}/` });
      continue;
    }
    const stat = fs.statSync(og);
    if (stat.size < MIN_BYTES) {
      issues.push({ slug, reason: `og-image.png muito pequena (${stat.size}B < ${MIN_BYTES}B)` });
      continue;
    }
    const dims = readPngDimensions(og);
    if (!dims) {
      issues.push({ slug, reason: `og-image.png nao e PNG valido` });
      continue;
    }
    if (dims.width < REQUIRED_WIDTH || dims.height < REQUIRED_HEIGHT) {
      issues.push({
        slug,
        reason: `og-image.png ${dims.width}x${dims.height} < requerido ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}`,
      });
    }
  }

  if (issues.length === 0) {
    console.log(`[audit-og] OK — ${slugs.length} sites com og-image.png valida`);
    process.exit(0);
  }

  console.error(`[audit-og] FAIL — ${issues.length} site(s):`);
  for (const i of issues) console.error(`  ${i.slug}: ${i.reason}`);
  console.error('');
  console.error('Acao: regenerar OG via `npx tsx scripts/generate-og.ts {slug}` ou rodar build-site.sh sem --skip-og');
  process.exit(1);
}

main();
