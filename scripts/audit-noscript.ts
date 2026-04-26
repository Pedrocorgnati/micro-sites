#!/usr/bin/env tsx
/**
 * Audit de NoscriptFallback (CL-189).
 * Varre dist/*\/contato/index.html e dist/*\/lista-de-espera/index.html
 * e exige <noscript> contendo mailto: ou numero WhatsApp (wa.me|whatsapp).
 * Complementa scripts/validate-noscript-coverage.ts (Cat. D calculadoras).
 */
import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE = process.cwd();
const DIST = path.join(WORKSPACE, 'dist');
const TARGETS = ['contato/index.html', 'lista-de-espera/index.html'];

function main(): void {
  if (!fs.existsSync(DIST)) {
    console.log('[audit-noscript] SKIP — dist/ nao encontrado. Rode build antes.');
    process.exit(0);
  }
  const sites = fs.readdirSync(DIST, { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => e.name);
  const violations: string[] = [];
  let checked = 0;
  for (const site of sites) {
    for (const t of TARGETS) {
      const file = path.join(DIST, site, t);
      if (!fs.existsSync(file)) continue;
      checked++;
      const html = fs.readFileSync(file, 'utf8');
      const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/i);
      if (!noscript) {
        violations.push(`${site}/${t}: <noscript> ausente`);
        continue;
      }
      const inner = noscript[1];
      const hasMail = /mailto:/i.test(inner);
      const hasWa = /(wa\.me|whatsapp)/i.test(inner);
      if (!hasMail && !hasWa) {
        violations.push(`${site}/${t}: <noscript> sem mailto/WhatsApp`);
      }
    }
  }
  if (violations.length === 0) {
    console.log(`[audit-noscript] PASS — ${checked} paginas cobertas`);
    process.exit(0);
  }
  console.error(`[audit-noscript] FAIL — ${violations.length} violacoes:`);
  violations.slice(0, 30).forEach(v => console.error(`  ${v}`));
  process.exit(1);
}

main();
