#!/usr/bin/env tsx
/**
 * audit-contacts-consistency.ts — CL-143 + CL-387
 *
 * Varre todos os sites/ *\/config.json e rejeita:
 *   - contactEmail ausente, malformado, em dominio de teste
 *   - whatsappNumber ausente, fora do formato 55DDDXXXXXXXXX ou placeholder conhecido
 *   - qualquer hardcoded de placeholder em src/
 *
 * Exit 1 em violacoes — bloqueia build CI.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const EMAIL_PLACEHOLDERS = new Set([
  'test@test.com',
  'email@example.com',
  'mock@example.com',
]);
const EMAIL_BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.org',
  'test.com',
  'localhost',
]);
const WHATSAPP_PATTERN = /^55\d{10,11}$/;
const WHATSAPP_PLACEHOLDERS = new Set([
  '5500000000000',
  '5511000000000',
  '5599999999999',
  '5511999999999',
  '5511999990001','5511999990002','5511999990003','5511999990004','5511999990005',
  '5511999990006','5511999990007','5511999990008','5511999990009','5511999990010',
]);

// Padroes proibidos em src/ (hardcodes)
const HARDCODE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'whatsapp placeholder 55...999999999', regex: /wa\.me\/55\d*9{4,}/ },
  { name: 'email example.com', regex: /[\w.+-]+@example\.com/i },
  { name: 'email test@', regex: /test@[\w.+-]+/i },
];

// Arquivos isentos da varredura de hardcodes (blocklists/fixtures)
const HARDCODE_EXEMPT = new Set<string>([
  'src/schemas/config.ts', // define EMAIL_PLACEHOLDERS/EMAIL_BLOCKED_DOMAINS
  'src/schemas/__tests__/config.test.ts', // testes de rejeicao usam placeholders
  'src/schemas/__tests__/fixtures.ts',
]);

type Violation = { file: string; kind: string; detail: string };
const violations: Violation[] = [];

function scanConfigs(root: string): void {
  const entries = readdirSync(root);
  for (const slug of entries) {
    if (slug.startsWith('_') || slug.startsWith('.')) continue;
    const dir = join(root, slug);
    if (!statSync(dir).isDirectory()) continue;
    const cfg = join(dir, 'config.json');
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(cfg, 'utf-8'));
    } catch (e) {
      violations.push({ file: cfg, kind: 'parse', detail: String(e) });
      continue;
    }
    const data = raw as Record<string, unknown>;
    const email = (data.contactEmail ?? '') as string;
    const cta = (data.cta ?? {}) as Record<string, unknown>;
    const wa = (cta.whatsappNumber ?? '') as string;

    if (!email) {
      violations.push({ file: cfg, kind: 'CL-143', detail: 'contactEmail ausente' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      violations.push({ file: cfg, kind: 'CL-143', detail: `email malformado: ${email}` });
    } else if (EMAIL_PLACEHOLDERS.has(email.toLowerCase())) {
      violations.push({ file: cfg, kind: 'CL-143', detail: `email placeholder: ${email}` });
    } else {
      const domain = email.split('@')[1]?.toLowerCase() ?? '';
      if (EMAIL_BLOCKED_DOMAINS.has(domain)) {
        violations.push({ file: cfg, kind: 'CL-143', detail: `email em dominio bloqueado: ${email}` });
      }
    }

    if (!wa) {
      violations.push({ file: cfg, kind: 'CL-387', detail: 'whatsappNumber ausente' });
    } else if (!WHATSAPP_PATTERN.test(wa)) {
      violations.push({ file: cfg, kind: 'CL-387', detail: `whatsappNumber fora do formato 55DDDXXXXXXXXX: ${wa}` });
    } else if (WHATSAPP_PLACEHOLDERS.has(wa)) {
      violations.push({ file: cfg, kind: 'CL-387', detail: `whatsappNumber placeholder: ${wa}` });
    }
  }
}

function scanHardcodes(root: string): void {
  const queue: string[] = [root];
  while (queue.length) {
    const current = queue.shift()!;
    const entries = readdirSync(current);
    for (const name of entries) {
      const path = join(current, name);
      const st = statSync(path);
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === '__tests__' || name.startsWith('.')) continue;
        queue.push(path);
      } else if (/\.(ts|tsx|js|jsx)$/.test(name)) {
        const relPath = relative(process.cwd(), path).replace(/\\/g, '/');
        if (HARDCODE_EXEMPT.has(relPath)) continue;
        const content = readFileSync(path, 'utf-8');
        for (const { name: kind, regex } of HARDCODE_PATTERNS) {
          const m = content.match(regex);
          if (m) {
            violations.push({ file: relative(process.cwd(), path), kind: 'hardcode', detail: `${kind}: ${m[0]}` });
          }
        }
      }
    }
  }
}

scanConfigs('sites');
scanHardcodes('src');

if (violations.length === 0) {
  console.log('[audit-contacts] OK — 0 violacoes (CL-143 + CL-387)');
  process.exit(0);
}

console.error(`[audit-contacts] FALHA — ${violations.length} violacoes:`);
for (const v of violations) {
  console.error(`  [${v.kind}] ${v.file}`);
  console.error(`      ${v.detail}`);
}
process.exit(1);
