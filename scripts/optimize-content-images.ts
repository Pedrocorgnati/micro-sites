#!/usr/bin/env tsx
/**
 * optimize-content-images.ts
 * Varre public/content/** e emite derivados .webp + .avif
 * a partir de .jpg/.jpeg/.png. Idempotente: só reprocessa se
 * mtime do fonte > mtime do derivado.
 *
 * Gap coberto: CL-323 (WebP/AVIF com fallback).
 *
 * Dependência: `sharp`. Se ausente, o script imprime warning
 * e encerra com exit 0 para não bloquear build.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public/content');
const EXTS = new Set(['.jpg', '.jpeg', '.png']);

type Derivative = { ext: '.webp' | '.avif'; opts: Record<string, unknown> };
const DERIVATIVES: Derivative[] = [
  { ext: '.webp', opts: { quality: 82 } },
  { ext: '.avif', opts: { quality: 60 } },
];

async function loadSharp() {
  try {
    const mod = await import('sharp');
    return (mod.default ?? mod) as typeof import('sharp').default;
  } catch {
    console.warn('[optimize-content-images] sharp não instalado — pulando.');
    return null;
  }
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (EXTS.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function needsRebuild(src: string, dst: string): Promise<boolean> {
  try {
    const [s, d] = await Promise.all([fs.stat(src), fs.stat(dst)]);
    return s.mtimeMs > d.mtimeMs;
  } catch {
    return true;
  }
}

async function main() {
  const sharp = await loadSharp();
  if (!sharp) process.exit(0);

  const files = await walk(ROOT);
  if (files.length === 0) {
    console.log('[optimize-content-images] sem imagens em public/content/.');
    return;
  }

  let built = 0;
  let skipped = 0;
  for (const src of files) {
    const base = src.replace(/\.(jpe?g|png)$/i, '');
    for (const d of DERIVATIVES) {
      const dst = base + d.ext;
      if (!(await needsRebuild(src, dst))) {
        skipped++;
        continue;
      }
      const pipeline = sharp(src);
      const fn = d.ext === '.webp' ? 'webp' : 'avif';
      await (pipeline as unknown as Record<string, (o: unknown) => typeof pipeline>)[fn](d.opts).toFile(dst);
      built++;
    }
  }
  console.log(`[optimize-content-images] built=${built} skipped=${skipped} files=${files.length}`);
}

main().catch((err) => {
  console.error('[optimize-content-images] falhou:', err);
  process.exit(1);
});
