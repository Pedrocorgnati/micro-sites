#!/usr/bin/env tsx
/**
 * generate-og.ts — Gerador de OG Image (1200×630) para micro-sites
 *
 * Usa src/lib/og-image-generator.ts (Satori + @resvg/resvg-js)
 * Processa um único site (via argumento/SITE_SLUG) ou todos os sites.
 *
 * Uso:
 *   npx tsx scripts/generate-og.ts d01-calculadora-custo-site
 *   npx tsx scripts/generate-og.ts        # processa todos os sites
 *   SITE_SLUG=d01-calculadora-custo-site npx tsx scripts/generate-og.ts
 */

import path from 'node:path';
import fs from 'node:fs';
import { getAllSlugs, loadSiteConfig } from '../src/lib/content-loader';
import { generateOGImage } from '../src/lib/og-image-generator';

const SLUG_ARG = process.argv[2] ?? process.env.SITE_SLUG ?? '';
const DIST_DIR = path.join(process.cwd(), 'dist');

async function main() {
  const slugs = SLUG_ARG ? [SLUG_ARG] : getAllSlugs();

  if (slugs.length === 0) {
    console.log('[generate-og] Nenhum site encontrado em sites/');
    return;
  }

  console.log(`[generate-og] Gerando OG images para ${slugs.length} site(s)...`);

  for (const slug of slugs) {
    try {
      const config = loadSiteConfig(slug);
      const siteDistDir = path.join(DIST_DIR, slug);

      if (!fs.existsSync(siteDistDir)) {
        fs.mkdirSync(siteDistDir, { recursive: true });
      }

      const outputPath = await generateOGImage(config, siteDistDir);
      console.log(`  ✓ ${slug} → ${outputPath}`);
    } catch (err) {
      // BUILD_056 — falha em OG image é warning (não aborta geração dos demais)
      console.error(`  ✗ [WARN BUILD_056] ${slug}: ${err}`);
    }
  }
}

main().catch(console.error);
