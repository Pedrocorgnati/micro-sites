#!/usr/bin/env tsx
/**
 * generate-htaccess-redirects — gera .htaccess 301 para migrar subdominio
 * Hostinger → dominio proprio.
 *
 * Uso:
 *   tsx scripts/generate-htaccess-redirects.ts <slug> <newDomain> [oldHost]
 *   tsx scripts/generate-htaccess-redirects.ts d01-calculadora-custo-site calculadora.com d01.meudominio.com
 *
 * Output: dist/<slug>/.htaccess
 */

import fs from 'node:fs';
import path from 'node:path';

const [, , slug, newDomain, oldHostArg] = process.argv;

if (!slug || !newDomain) {
  console.error('Uso: tsx scripts/generate-htaccess-redirects.ts <slug> <newDomain> [oldHost]');
  process.exit(2);
}

const ROOT = process.cwd();
const templatePath = path.join(ROOT, 'sites', '_template', '.htaccess.template');
if (!fs.existsSync(templatePath)) {
  console.error(`[htaccess] template ausente: ${templatePath}`);
  process.exit(2);
}

const cfgPath = path.join(ROOT, 'sites', slug, 'config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
const baseSlug = slug.split('-')[0];
const oldHost = oldHostArg ?? `${baseSlug}.${cfg.defaultDomain ?? 'DOMAIN.com'}`;

const template = fs.readFileSync(templatePath, 'utf8');
const rendered = template
  .replace(/\{NEW_DOMAIN\}/g, newDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''))
  .replace(/\{OLD_HOST\}/g, oldHost.replace(/\./g, '\\.'));

const outDir = path.join(ROOT, 'dist', slug);
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, '.htaccess');
fs.writeFileSync(outFile, rendered);

console.log(`[htaccess] ${slug}: ${oldHost} → ${newDomain} → ${outFile}`);
