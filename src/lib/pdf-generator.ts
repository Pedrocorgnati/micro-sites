// src/lib/pdf-generator.ts
// Builder generico de PDF lead-magnet (TASK-1 intake-review).
// Usa pdf-lib (ADR-pdf-generator). Sem dependencia de browser/headless.

import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { SiteConfig } from '@/types';

// ============================================================
// Tipos de template
// ============================================================

export interface PdfHeading {
  type: 'heading';
  level?: 1 | 2 | 3;
  text: string;
}

export interface PdfParagraph {
  type: 'paragraph';
  text: string;
}

export interface PdfList {
  type: 'list';
  style?: 'bullet' | 'numbered';
  items: string[];
}

export interface PdfTable {
  type: 'table';
  columns: string[];
  rows: string[][];
}

export interface PdfCallout {
  type: 'callout';
  text: string;
}

export interface PdfSectionBreak {
  type: 'section-break';
}

export type PdfBlock =
  | PdfHeading
  | PdfParagraph
  | PdfList
  | PdfTable
  | PdfCallout
  | PdfSectionBreak;

export interface PdfTemplate {
  title: string;
  subtitle?: string;
  blocks: PdfBlock[];
}

export interface GeneratedPdf {
  outputPath: string;
  bytes: number;
  pageCount: number;
}

// ============================================================
// Constantes de layout (A4 portrait)
// ============================================================

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const MARGIN_TOP = 96; // espaco para header
const MARGIN_BOTTOM = 72; // espaco para footer

const COLOR_BG = rgb(0.06, 0.09, 0.16); // #0F172A
const COLOR_ACCENT = rgb(0.486, 0.227, 0.929); // #7C3AED
const COLOR_TEXT = rgb(0.09, 0.12, 0.20); // #17213A
const COLOR_MUTED = rgb(0.42, 0.47, 0.55); // #6B7280
const COLOR_RULE = rgb(0.86, 0.88, 0.91); // #DCE0E5

// ============================================================
// Helpers de texto (wrap simples baseado em PDFFont.widthOfTextAtSize)
// ============================================================

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        // palavra isolada maior que a linha — forca quebrar
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          lines.push(word);
          current = '';
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

// ============================================================
// Context de renderizacao (cursor "y" descendente)
// ============================================================

interface RenderContext {
  doc: PDFDocument;
  page: PDFPage;
  fontRegular: PDFFont;
  fontBold: PDFFont;
  fontItalic: PDFFont;
  cursorY: number;
  config: SiteConfig;
  title: string;
}

function addPage(ctx: RenderContext): PDFPage {
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.page = page;
  ctx.cursorY = PAGE_HEIGHT - MARGIN_TOP;
  drawHeader(ctx);
  drawFooter(ctx);
  return page;
}

function ensureSpace(ctx: RenderContext, needed: number) {
  if (ctx.cursorY - needed < MARGIN_BOTTOM) {
    addPage(ctx);
  }
}

// ============================================================
// Header / Footer
// ============================================================

function drawHeader(ctx: RenderContext) {
  const { page, fontBold, fontRegular, config, title } = ctx;
  const headerY = PAGE_HEIGHT - 56;

  // Barra de marca
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 8,
    width: PAGE_WIDTH,
    height: 8,
    color: COLOR_ACCENT,
  });

  // Logo textual SystemForge
  page.drawText('SystemForge', {
    x: MARGIN_X,
    y: headerY,
    size: 12,
    font: fontBold,
    color: COLOR_BG,
  });

  // Nome do site
  page.drawText(config.name, {
    x: MARGIN_X,
    y: headerY - 16,
    size: 9,
    font: fontRegular,
    color: COLOR_MUTED,
  });

  // Data + titulo curto no lado direito
  const date = new Date().toLocaleDateString('pt-BR');
  const rightText = `${title} · ${date}`;
  const rightWidth = fontRegular.widthOfTextAtSize(rightText, 9);
  page.drawText(rightText, {
    x: PAGE_WIDTH - MARGIN_X - rightWidth,
    y: headerY - 6,
    size: 9,
    font: fontRegular,
    color: COLOR_MUTED,
  });
}

function drawFooter(ctx: RenderContext) {
  const { page, fontRegular, fontBold, config } = ctx;
  const footerY = 40;

  page.drawRectangle({
    x: MARGIN_X,
    y: footerY + 22,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: 0.5,
    color: COLOR_RULE,
  });

  page.drawText('Fale com um especialista pelo WhatsApp:', {
    x: MARGIN_X,
    y: footerY + 8,
    size: 9,
    font: fontRegular,
    color: COLOR_MUTED,
  });

  const waNumber = config.cta.whatsappNumber;
  const waUrl = `https://wa.me/${waNumber}`;
  page.drawText(waUrl, {
    x: MARGIN_X,
    y: footerY - 6,
    size: 10,
    font: fontBold,
    color: COLOR_ACCENT,
  });
}

// ============================================================
// Renderers por tipo de bloco
// ============================================================

const MAX_TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

function drawHeading(ctx: RenderContext, block: PdfHeading) {
  const level = block.level ?? 2;
  const size = level === 1 ? 22 : level === 2 ? 16 : 13;
  ensureSpace(ctx, size + 12);
  const lines = wrapText(block.text, ctx.fontBold, size, MAX_TEXT_WIDTH);
  for (const line of lines) {
    ctx.cursorY -= size + 4;
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: ctx.cursorY,
      size,
      font: ctx.fontBold,
      color: COLOR_BG,
    });
  }
  ctx.cursorY -= 6;
}

function drawParagraph(ctx: RenderContext, block: PdfParagraph) {
  const size = 11;
  const lineHeight = size * 1.35;
  const lines = wrapText(block.text, ctx.fontRegular, size, MAX_TEXT_WIDTH);
  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    ctx.cursorY -= lineHeight;
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: ctx.cursorY,
      size,
      font: ctx.fontRegular,
      color: COLOR_TEXT,
    });
  }
  ctx.cursorY -= 4;
}

function drawList(ctx: RenderContext, block: PdfList) {
  const size = 11;
  const lineHeight = size * 1.35;
  const bulletWidth = 18;
  const indent = MARGIN_X + bulletWidth;

  block.items.forEach((item, idx) => {
    const marker = block.style === 'numbered' ? `${idx + 1}.` : '•';
    const lines = wrapText(item, ctx.fontRegular, size, MAX_TEXT_WIDTH - bulletWidth);
    lines.forEach((line, lineIdx) => {
      ensureSpace(ctx, lineHeight);
      ctx.cursorY -= lineHeight;
      if (lineIdx === 0) {
        ctx.page.drawText(marker, {
          x: MARGIN_X,
          y: ctx.cursorY,
          size,
          font: ctx.fontBold,
          color: COLOR_ACCENT,
        });
      }
      ctx.page.drawText(line, {
        x: indent,
        y: ctx.cursorY,
        size,
        font: ctx.fontRegular,
        color: COLOR_TEXT,
      });
    });
    ctx.cursorY -= 2;
  });
  ctx.cursorY -= 4;
}

function drawTable(ctx: RenderContext, block: PdfTable) {
  const size = 10;
  const lineHeight = size * 1.5;
  const cols = block.columns.length;
  if (cols === 0) return;
  const colWidth = MAX_TEXT_WIDTH / cols;

  function renderRow(cells: string[], bold: boolean, bg?: boolean) {
    const wrapped = cells.map((cell) =>
      wrapText(cell, bold ? ctx.fontBold : ctx.fontRegular, size, colWidth - 12)
    );
    const rowLines = Math.max(...wrapped.map((w) => w.length), 1);
    const rowHeight = rowLines * lineHeight + 6;
    ensureSpace(ctx, rowHeight);

    if (bg) {
      ctx.page.drawRectangle({
        x: MARGIN_X,
        y: ctx.cursorY - rowHeight + 4,
        width: MAX_TEXT_WIDTH,
        height: rowHeight,
        color: rgb(0.96, 0.95, 1),
      });
    }

    wrapped.forEach((lines, colIdx) => {
      lines.forEach((line, lineIdx) => {
        ctx.page.drawText(line, {
          x: MARGIN_X + colIdx * colWidth + 6,
          y: ctx.cursorY - lineHeight - lineIdx * lineHeight,
          size,
          font: bold ? ctx.fontBold : ctx.fontRegular,
          color: bold ? COLOR_BG : COLOR_TEXT,
        });
      });
    });

    // linha inferior
    ctx.page.drawRectangle({
      x: MARGIN_X,
      y: ctx.cursorY - rowHeight + 3,
      width: MAX_TEXT_WIDTH,
      height: 0.5,
      color: COLOR_RULE,
    });

    ctx.cursorY -= rowHeight;
  }

  renderRow(block.columns, true, true);
  for (const row of block.rows) renderRow(row, false);
  ctx.cursorY -= 6;
}

function drawCallout(ctx: RenderContext, block: PdfCallout) {
  const size = 11;
  const lineHeight = size * 1.4;
  const padding = 12;
  const innerWidth = MAX_TEXT_WIDTH - padding * 2;
  const lines = wrapText(block.text, ctx.fontItalic, size, innerWidth);
  const height = lines.length * lineHeight + padding * 2;
  ensureSpace(ctx, height + 6);

  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.cursorY - height,
    width: MAX_TEXT_WIDTH,
    height,
    color: rgb(0.97, 0.95, 1),
  });
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.cursorY - height,
    width: 3,
    height,
    color: COLOR_ACCENT,
  });

  lines.forEach((line, idx) => {
    ctx.page.drawText(line, {
      x: MARGIN_X + padding,
      y: ctx.cursorY - padding - (idx + 1) * lineHeight + 4,
      size,
      font: ctx.fontItalic,
      color: COLOR_BG,
    });
  });

  ctx.cursorY -= height + 8;
}

// ============================================================
// Entry point
// ============================================================

export async function generateReportPDF(
  config: SiteConfig,
  template: PdfTemplate,
  outputPath: string
): Promise<GeneratedPdf> {
  const doc = await PDFDocument.create();
  doc.setTitle(template.title);
  doc.setAuthor('SystemForge');
  doc.setSubject(config.name);
  doc.setProducer('SystemForge micro-sites');
  doc.setCreator('SystemForge micro-sites (pdf-lib)');
  doc.setCreationDate(new Date());

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const firstPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const ctx: RenderContext = {
    doc,
    page: firstPage,
    fontRegular,
    fontBold,
    fontItalic,
    cursorY: PAGE_HEIGHT - MARGIN_TOP,
    config,
    title: template.title,
  };

  drawHeader(ctx);
  drawFooter(ctx);

  // Titulo + subtitulo
  drawHeading(ctx, { type: 'heading', level: 1, text: template.title });
  if (template.subtitle) {
    drawParagraph(ctx, { type: 'paragraph', text: template.subtitle });
  }

  // Blocos
  for (const block of template.blocks) {
    switch (block.type) {
      case 'heading':
        drawHeading(ctx, block);
        break;
      case 'paragraph':
        drawParagraph(ctx, block);
        break;
      case 'list':
        drawList(ctx, block);
        break;
      case 'table':
        drawTable(ctx, block);
        break;
      case 'callout':
        drawCallout(ctx, block);
        break;
      case 'section-break':
        addPage(ctx);
        break;
    }
  }

  const bytes = await doc.save();

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, bytes);

  return {
    outputPath,
    bytes: bytes.length,
    pageCount: doc.getPageCount(),
  };
}

/** Carrega um template a partir de sites/{slug}/content/pdf-template.json */
export function loadPdfTemplate(slug: string): PdfTemplate | null {
  const templatePath = path.join(process.cwd(), 'sites', slug, 'content', 'pdf-template.json');
  if (!fs.existsSync(templatePath)) return null;
  const raw = fs.readFileSync(templatePath, 'utf-8');
  const parsed = JSON.parse(raw) as PdfTemplate;
  return parsed;
}

/**
 * Sites elegiveis para gerar PDF (via config.leadMagnet.enabled === true).
 * Mantido como helper para testes.
 */
export function isPdfEligible(config: SiteConfig): boolean {
  return Boolean(
    (config as unknown as { leadMagnet?: { enabled?: boolean } }).leadMagnet?.enabled
  );
}
