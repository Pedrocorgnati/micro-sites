#!/usr/bin/env tsx
/**
 * generate-default-assets.ts — One-shot generator for brand defaults em public/.
 *
 * Gera:
 *   - public/og-default.png          (1200x630, SystemForge neutro)
 *   - public/apple-touch-icon.png    (180x180)
 *   - public/android-chrome-192x192.png
 *   - public/android-chrome-512x512.png
 *
 * Execucao: npx tsx scripts/generate-default-assets.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const FONT_CANDIDATES = [
  path.join(PUBLIC_DIR, 'fonts/PlusJakartaSans-Bold.ttf'),
  // Fallback: fonte Geist empacotada com @vercel/og (sempre presente em projetos Next 15+).
  path.join(ROOT, 'node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf'),
];

const BRAND_BG = '#0F172A';
const BRAND_ACCENT = '#7C3AED';
const BRAND_ON = '#FFFFFF';
const BRAND_MUTED = '#94A3B8';

function loadFont(): Buffer | null {
  for (const candidate of FONT_CANDIDATES) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate);
  }
  return null;
}

async function renderSvgToPng(svg: string, width: number): Promise<Buffer> {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  return Buffer.from(resvg.render().asPng());
}

async function generateOgDefault(outputPath: string) {
  const fontData = loadFont();
  const fonts = fontData
    ? [{ name: 'Plus Jakarta Sans', data: fontData, weight: 700 as const }]
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element: any = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
        backgroundColor: BRAND_BG,
        padding: '60px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: '60px',
              height: '4px',
              backgroundColor: BRAND_ACCENT,
              marginBottom: '24px',
              borderRadius: '2px',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '56px',
              fontWeight: 700,
              color: BRAND_ON,
              lineHeight: 1.1,
              marginBottom: '20px',
            },
            children: 'SystemForge Micro Sites',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '24px',
              color: BRAND_MUTED,
              lineHeight: 1.4,
            },
            children:
              'Micro sites especializados para geracao de demanda, diagnostico e conversao.',
          },
        },
      ],
    },
  };

  const svg = await satori(element, { width: 1200, height: 630, fonts });
  const png = await renderSvgToPng(svg, 1200);
  fs.writeFileSync(outputPath, png);
  console.log(`  ok og-default.png (${png.length} bytes) -> ${outputPath}`);
}

function buildIconSvg(size: number): string {
  // Quadrado com iniciais "SF" centralizado, fundo gradient-friendly (SVG plano).
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.42);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${BRAND_BG}"/>
  <rect x="${Math.round(size * 0.14)}" y="${Math.round(size * 0.74)}" width="${Math.round(size * 0.18)}" height="${Math.round(size * 0.06)}" rx="${Math.round(size * 0.02)}" fill="${BRAND_ACCENT}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="800"
        font-size="${fontSize}" fill="${BRAND_ON}">SF</text>
</svg>`;
}

async function generateIcon(size: number, outputPath: string) {
  const svg = buildIconSvg(size);
  const png = await renderSvgToPng(svg, size);
  fs.writeFileSync(outputPath, png);
  console.log(`  ok ${path.basename(outputPath)} (${size}x${size}, ${png.length} bytes)`);
}

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  console.log('[generate-default-assets] gerando assets em public/');

  await generateOgDefault(path.join(PUBLIC_DIR, 'og-default.png'));
  await generateIcon(180, path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  await generateIcon(192, path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
  await generateIcon(512, path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));

  console.log('[generate-default-assets] concluido');
}

main().catch((err) => {
  console.error('[generate-default-assets] falha:', err);
  process.exit(1);
});
