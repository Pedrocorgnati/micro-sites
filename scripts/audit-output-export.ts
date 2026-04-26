#!/usr/bin/env tsx
/**
 * audit-output-export.ts (CL-633)
 * Falha CI se next.config.ts nao tiver output: 'export'.
 * Static export e requisito do deploy Hostinger shared.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const configPath = resolve(process.cwd(), 'next.config.ts');
const source = readFileSync(configPath, 'utf8');

const hasOutputExport = /output\s*:\s*['"]export['"]/.test(source);

if (!hasOutputExport) {
  console.error('[audit-output-export] FAIL: next.config.ts nao tem output: \'export\'.');
  console.error('  Static export e obrigatorio para deploy Hostinger shared.');
  process.exit(1);
}

console.log('[audit-output-export] OK: output: \'export\' presente.');
