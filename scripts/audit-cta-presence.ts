#!/usr/bin/env tsx
/**
 * Audit de presenca de CTA (CL-252).
 * Analisa dist/{site}/*.html. Exige ao menos um <a> ou <button> com data-cta
 * ou texto em lista de verbos-CTA nos primeiros ~1000px (primeiros ~120 nos do body).
 * Override: atributo `data-audit-ok="cta"` no <main>.
 */
import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE = process.cwd();
const DIST = path.join(WORKSPACE, 'dist');
const CTA_VERBS = /(agende|calcule|fale|comece|solicite|peca|baixe|cadastre|inscreva|receba|teste|descubra|conheca|compre|contrate|saiba mais|entre em contato|ver resultado|enviar)/i;

function walkHtml(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function hasCta(html: string): boolean {
  if (/data-audit-ok="cta"/.test(html)) return true;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const firstSlice = body.slice(0, Math.min(body.length, 12000));
  if (/data-cta=/.test(firstSlice)) return true;
  const tags = firstSlice.match(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi) ?? [];
  for (const tag of tags.slice(0, 15)) {
    const text = tag.replace(/<[^>]+>/g, '').trim();
    if (CTA_VERBS.test(text)) return true;
  }
  return false;
}

function main(): void {
  if (!fs.existsSync(DIST)) {
    console.log('[audit-cta-presence] SKIP — dist/ nao encontrado. Rode build antes.');
    process.exit(0);
  }
  const files = walkHtml(DIST);
  const missing: string[] = [];
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    if (!hasCta(html)) missing.push(path.relative(WORKSPACE, f));
  }
  if (missing.length === 0) {
    console.log(`[audit-cta-presence] PASS — ${files.length} paginas com CTA above-the-fold`);
    process.exit(0);
  }
  console.error(`[audit-cta-presence] FAIL — ${missing.length} paginas sem CTA detectavel:`);
  missing.slice(0, 30).forEach(f => console.error(`  ${f}`));
  process.exit(1);
}

main();
