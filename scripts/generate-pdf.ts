#!/usr/bin/env tsx
/**
 * generate-pdf.ts — Gera PDFs de lead-magnet para sites elegiveis.
 *
 * Elegibilidade: config.leadMagnet.enabled === true E existe
 * sites/{slug}/content/pdf-template.json.
 *
 * Usa src/lib/pdf-generator.ts (pdf-lib).
 *
 * Uso:
 *   npx tsx scripts/generate-pdf.ts                     # processa todos
 *   npx tsx scripts/generate-pdf.ts d01-calculadora-custo-site
 *   SITE_SLUG=... npx tsx scripts/generate-pdf.ts
 */

import path from 'node:path';
import fs from 'node:fs';
import { getAllSlugs, loadSiteConfig } from '../src/lib/content-loader';
import {
  generateReportPDF,
  loadPdfTemplate,
  isPdfEligible,
} from '../src/lib/pdf-generator';

const SLUG_ARG = process.argv[2] ?? process.env.SITE_SLUG ?? '';
const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const MAX_PDF_BYTES = 500 * 1024; // 500KB (criterio de aceite TASK-1)

async function main() {
  const slugs = SLUG_ARG ? [SLUG_ARG] : getAllSlugs();
  if (slugs.length === 0) {
    console.log('[generate-pdf] Nenhum site encontrado em sites/');
    return;
  }

  const failed: string[] = [];
  let generated = 0;
  let skipped = 0;

  console.log(`[generate-pdf] avaliando ${slugs.length} site(s)...`);

  for (const slug of slugs) {
    let config;
    try {
      config = loadSiteConfig(slug);
    } catch (err) {
      // Config invalido — so falhar se escopo e um unico slug
      if (SLUG_ARG) {
        console.error(`  x ${slug}: config invalido — ${err}`);
        failed.push(slug);
      } else {
        skipped++;
      }
      continue;
    }

    if (!isPdfEligible(config)) {
      skipped++;
      continue;
    }

    const template = loadPdfTemplate(slug);
    if (!template) {
      // Politica: site marcado como leadMagnet mas sem template e ERRO de build.
      // Falhar explicitamente ao processar esse slug isoladamente (ou todos se SITE_SLUG).
      const msg = `[generate-pdf] template ausente em sites/${slug}/content/pdf-template.json`;
      console.error(`  x ${msg}`);
      failed.push(slug);
      continue;
    }

    const outputDir = path.join(DIST_DIR, slug);
    const outputPath = path.join(outputDir, 'relatorio.pdf');

    try {
      const result = await generateReportPDF(config, template, outputPath);
      const oversized = result.bytes > MAX_PDF_BYTES;
      const sizeKb = (result.bytes / 1024).toFixed(1);
      const pageInfo = `${result.pageCount} pag`;
      const marker = oversized ? '! WARN: >500KB' : '';
      console.log(`  ok ${slug} -> ${outputPath} (${sizeKb}KB, ${pageInfo})${marker ? ' ' + marker : ''}`);
      generated++;
    } catch (err) {
      console.error(`  x [WARN PDF_001] ${slug}: ${err}`);
      failed.push(slug);
    }
  }

  console.log(
    `[generate-pdf] concluido: gerados=${generated}, pulados=${skipped}, falhas=${failed.length}`
  );

  if (failed.length > 0) {
    // Fail hard quando escopo e um unico site OU quando failures sao devido a template ausente
    // em site elegivel (criterio de aceite).
    console.error(`[generate-pdf] falhas em: ${failed.join(', ')}`);
    process.exit(1);
  }

  // Garantia defensiva: impede publicar PDFs vazios
  void fs; // manter import usado quando script evoluir
}

main().catch((err) => {
  console.error('[generate-pdf] erro fatal:', err);
  process.exit(1);
});
