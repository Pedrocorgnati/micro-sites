/**
 * generate-category-favicons.ts
 * Fonte: TASK-4 intake-review (CL-322).
 * Gera SVG + PNG (32/192/512) por categoria (A..F) com a letra da categoria
 * centralizada sobre o accentColor. ICO fica como PNG 32x32 renomeado se
 * necessario (fallback aceitavel: browsers modernos aceitam PNG como icon).
 */

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { CATEGORY_THEME_COLORS } from '../src/lib/category-theme';
import type { SiteCategory } from '../src/types';

const OUT_DIR = path.join(process.cwd(), 'sites', '_template', 'public', 'favicons');

function buildSvg(category: SiteCategory, color: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="${color}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="320"
        fill="#FFFFFF">${category}</text>
</svg>`;
}

function rasterize(svg: string, size: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  });
  return Buffer.from(resvg.render().asPng());
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const categories = Object.keys(CATEGORY_THEME_COLORS) as SiteCategory[];
  for (const cat of categories) {
    const color = CATEGORY_THEME_COLORS[cat];
    const svg = buildSvg(cat, color);
    const base = path.join(OUT_DIR, `category-${cat}`);

    fs.writeFileSync(`${base}.svg`, svg, 'utf-8');
    fs.writeFileSync(`${base}-32.png`, rasterize(svg, 32));
    fs.writeFileSync(`${base}-192.png`, rasterize(svg, 192));
    fs.writeFileSync(`${base}-512.png`, rasterize(svg, 512));
    fs.writeFileSync(`${base}.ico`, rasterize(svg, 32));

    console.log(`  ✓ category-${cat} (${color}) gerado`);
  }

  console.log(`\nOK: ${categories.length} categorias. Saida: ${path.relative(process.cwd(), OUT_DIR)}`);
}

main();
