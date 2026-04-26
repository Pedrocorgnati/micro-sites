#!/usr/bin/env tsx
/**
 * validate-bundle-size.ts
 * Verifica (warning-only) que o chunk do Calculator não está sendo
 * carregado por rotas não-D.
 *
 * Gap coberto: CL-291 (code-splitting Calculator).
 *
 * Estratégia: parsear `.next/app-build-manifest.json` após `next build`
 * e garantir que a página `/` carrega Calculator apenas via dynamic chunk
 * (não inline). Rotas D (/quanto-custa, /diagnostico) estão autorizadas a
 * importar Calculator diretamente.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const MANIFEST = path.resolve(process.cwd(), '.next/app-build-manifest.json');
const D_ROUTES = new Set(['/quanto-custa/page', '/diagnostico/page']);
const CHECK_ROUTES = ['/page']; // root; resolvido dinamicamente por slug

async function main() {
  let raw: string;
  try {
    raw = await fs.readFile(MANIFEST, 'utf8');
  } catch {
    console.warn('[validate-bundle-size] .next/app-build-manifest.json ausente — rode `next build` antes.');
    process.exit(0);
  }
  const manifest = JSON.parse(raw) as { pages?: Record<string, string[]> };
  const pages = manifest.pages ?? {};
  const problems: string[] = [];

  for (const route of CHECK_ROUTES) {
    const chunks = pages[route] ?? [];
    const inline = chunks.find((c) => /Calculator/.test(c) && !/dynamic|chunks\//.test(c));
    if (inline) {
      problems.push(`[${route}] chunk inline suspeito: ${inline}`);
    }
  }

  for (const d of D_ROUTES) {
    if (!pages[d]) {
      console.warn(`[validate-bundle-size] rota D ausente do manifest: ${d}`);
    }
  }

  if (problems.length > 0) {
    console.warn('[validate-bundle-size] warnings:');
    problems.forEach((p) => console.warn(' -', p));
    // warning-only: não falha o build
  } else {
    console.log('[validate-bundle-size] OK — Calculator isolado em chunk dinâmico.');
  }

  // ── Font preload check (CL-281 / TASK-5) ────────────────────────────────
  // Next.js com next/font/google + display:swap gera link rel="preload" para
  // as fontes self-hosted automaticamente. Este check le o HTML exportado
  // (se disponivel) e valida presenca.
  const distIndex = path.resolve(process.cwd(), 'dist', 'index.html');
  try {
    const html = await fs.readFile(distIndex, 'utf8');
    const hasFontPreload = /<link[^>]+rel=["']preload["'][^>]+as=["']font["']/.test(html);
    if (!hasFontPreload) {
      console.warn('[validate-bundle-size][fonts] dist/index.html SEM <link rel="preload" as="font"> — verificar next/font.');
    } else {
      console.log('[validate-bundle-size][fonts] OK — fonts preloaded no <head>.');
    }
  } catch {
    // dist/index.html ausente — check fica dormente (ok).
  }
}

main().catch((err) => {
  console.error('[validate-bundle-size] erro:', err);
  process.exit(0); // warning-only
});
