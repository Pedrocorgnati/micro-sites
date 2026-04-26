#!/usr/bin/env tsx
// scripts/validate-contracts.ts
// Verifica que todos os contratos do module-2 existem e são corretos

import type { SiteConfig, SiteCategory } from '@/types';
import type { BlogArticle } from '@/types';
import { SiteConfigSchema } from '@/schemas/config';
import { buildMetaTags } from '@/lib/seo-helpers';
import { buildLocalBusinessSchema } from '@/lib/schema-markup';
import { loadSiteConfig } from '@/lib/content-loader';
import * as fs from 'node:fs';
import * as path from 'node:path';

const results: { module: string; status: string; error?: string }[] = [];

function check(module: string, fn: () => void) {
  try {
    fn();
    results.push({ module, status: 'OK' });
    console.log(`✓ ${module}`);
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e);
    results.push({ module, status: 'FAIL', error: err });
    console.log(`✗ ${module}: ${err}`);
  }
}

// Verificar imports de @/types
check('@/types — SiteConfig, SiteCategory', () => {
  const t: SiteConfig | undefined = undefined;
  const c: SiteCategory | undefined = undefined;
  void t; void c;
});

check('@/types — BlogArticle', () => {
  const a: BlogArticle | undefined = undefined;
  void a;
});

// Verificar @/schemas/config
check('@/schemas/config — SiteConfigSchema', () => {
  if (!SiteConfigSchema || typeof SiteConfigSchema.safeParse !== 'function') {
    throw new Error('SiteConfigSchema not exported correctly');
  }
});

// Verificar @/lib/seo-helpers
check('@/lib/seo-helpers — buildMetaTags', () => {
  if (typeof buildMetaTags !== 'function') throw new Error('buildMetaTags is not a function');
});

check('@/lib/seo-helpers — buildLocalBusinessSchema', () => {
  if (typeof buildLocalBusinessSchema !== 'function') throw new Error('buildLocalBusinessSchema is not a function');
});

// Verificar @/lib/content-loader
check('@/lib/content-loader — loadSiteConfig', () => {
  if (typeof loadSiteConfig !== 'function') throw new Error('loadSiteConfig is not a function');
});

// Verificar que pasta sites/ existe e tem configs
check('sites/ directory exists', () => {
  const sitesDir = path.join(process.cwd(), 'sites');
  if (!fs.existsSync(sitesDir)) throw new Error('sites/ directory not found');
  const slugs = fs.readdirSync(sitesDir).filter((s) => s !== '_template');
  if (slugs.length < 36) throw new Error(`Expected 36 sites, found ${slugs.length}`);
});

// Validar um config.json com Zod
check('Zod validation — a01/config.json', () => {
  const configPath = path.join(process.cwd(), 'sites/a01/config.json');
  if (!fs.existsSync(configPath)) throw new Error('sites/a01/config.json not found');
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const result = SiteConfigSchema.safeParse(raw);
  if (!result.success) throw new Error(result.error.issues[0]?.message || 'Invalid config');
});

// Sumário
const failed = results.filter((r) => r.status === 'FAIL');
const passed = results.filter((r) => r.status === 'OK');

console.log(`\n━━━ Contratos module-2: ${passed.length} OK / ${failed.length} FALHA ━━━`);

// Gravar JSON de resultado
const output = {
  timestamp: new Date().toISOString(),
  summary: { passed: passed.length, failed: failed.length },
  results,
};

const outPath = path.join(process.cwd(), '..', '..', '..', 'docs', 'micro-sites', 'integration', 'contracts-validation.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Resultado gravado em: integration/contracts-validation.json`);

process.exit(failed.length > 0 ? 1 : 0);
