/**
 * audit-analytics-events.ts
 * Fonte: TASK-2 intake-review (CL-320)
 * Verifica que os 7 eventos GA4 de conversão existem no bundle.
 * Exit 1 se algum evento nao for encontrado.
 */

import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_EVENTS: readonly string[] = [
  'whatsapp_click',
  'contact_form_submit',
  'waitlist_signup',
  'calculator_started',
  'calculator_start',
  'calculator_completed',
  'lead_magnet_downloaded',
  'outbound_to_systemforge',
  'outbound_click',
];

const SEARCH_ROOTS = ['src', 'scripts'];

interface Match {
  event: string;
  file: string;
  line: number;
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name.startsWith('.')) continue;
      walk(full, acc);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function main() {
  const files = SEARCH_ROOTS.flatMap((root) => walk(path.join(process.cwd(), root)));
  const matches: Match[] = [];
  const found = new Set<string>();

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const ev of EXPECTED_EVENTS) {
        if (line.includes(`'${ev}'`) || line.includes(`"${ev}"`)) {
          matches.push({ event: ev, file: rel, line: idx + 1 });
          found.add(ev);
        }
      }
    });
  }

  console.log('GA4 Conversion Events audit\n');
  for (const ev of EXPECTED_EVENTS) {
    const hits = matches.filter((m) => m.event === ev);
    if (hits.length === 0) {
      console.log(`  [MISSING] ${ev}`);
    } else {
      for (const h of hits) {
        console.log(`  [OK] ${ev} -> ${h.file}:${h.line}`);
      }
    }
  }

  const missing = EXPECTED_EVENTS.filter((e) => !found.has(e));
  if (missing.length > 0) {
    console.error(`\nFAIL: ${missing.length} evento(s) faltando: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`\nOK: ${EXPECTED_EVENTS.length}/${EXPECTED_EVENTS.length} eventos presentes`);
}

main();
