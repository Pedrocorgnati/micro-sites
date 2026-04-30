#!/usr/bin/env node
/**
 * ADS-29/44 — Smoke tests pos-build do AdSense wiring.
 *
 * Verificacoes (offline, sobre o build):
 *   1. public/ads.txt existe e tem formato canonico.
 *   2. nginx.conf contem CSP com whitelist do AdSense.
 *   3. nginx.conf contem Permissions-Policy com browsing-topics.
 *   4. robots.ts permite Mediapartners-Google.
 *   5. NAO existe app/ads.txt/route.ts (colisao com public/).
 *   6. Configs de todos os sites tem bloco adsense.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');

const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (e) {
    checks.push({ name, ok: false, err: e.message });
    console.error(`✗ ${name}: ${e.message}`);
  }
}

check('public/ads.txt existe e tem formato canonico', () => {
  const f = path.join(ROOT, 'public', 'ads.txt');
  if (!fs.existsSync(f)) throw new Error('arquivo nao gerado (rode prebuild)');
  const content = fs.readFileSync(f, 'utf8');
  // ADS-REV-03: placeholder so eh aceito em dev — em CI/production falha.
  const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';
  const isProductionLike = APP_ENV === 'production' || process.env.CI === 'true';
  if (content.startsWith('# ads.txt placeholder')) {
    if (isProductionLike) throw new Error('placeholder nao permitido em CI/production');
    return; // dev OK
  }
  if (!/^google\.com,\s*pub-\d{16},\s*DIRECT,\s*f08c47fec0942fa0/m.test(content)) {
    throw new Error('formato invalido');
  }
});

check('nginx.conf contem CSP com pagead2', () => {
  const f = path.join(ROOT, 'nginx.conf');
  const c = fs.readFileSync(f, 'utf8');
  if (!c.includes('Content-Security-Policy')) throw new Error('CSP ausente');
  if (!c.includes('pagead2.googlesyndication.com')) throw new Error('CSP sem pagead2');
  if (!c.includes('googleads.g.doubleclick.net')) throw new Error('CSP sem doubleclick');
});

check('nginx.conf contem Permissions-Policy com browsing-topics', () => {
  const f = path.join(ROOT, 'nginx.conf');
  const c = fs.readFileSync(f, 'utf8');
  if (!c.includes('Permissions-Policy')) throw new Error('Permissions-Policy ausente');
  if (!c.includes('browsing-topics')) throw new Error('sem browsing-topics');
});

check('robots.ts permite Mediapartners-Google e AdsBot', () => {
  const f = path.join(ROOT, 'src/app/robots.ts');
  const c = fs.readFileSync(f, 'utf8');
  if (!c.includes('Mediapartners-Google')) throw new Error('Mediapartners-Google ausente');
  if (!c.includes('AdsBot-Google')) throw new Error('AdsBot-Google ausente');
});

check('NAO existe app/ads.txt/route.ts (colisao)', () => {
  const f = path.join(ROOT, 'src/app/ads.txt/route.ts');
  if (fs.existsSync(f)) throw new Error('route handler existe — remover');
});

check('SelfAd: 10 banners proprios em public/self-ads/', () => {
  const expected = [
    'corgnati-728x90.webp', 'corgnati-320x100.webp',
    'corgnati-336x280.webp', 'corgnati-300x250.webp', 'corgnati-300x600.webp',
    'forjadesistemas-728x90.webp', 'forjadesistemas-320x100.webp',
    'forjadesistemas-336x280.webp', 'forjadesistemas-300x250.webp', 'forjadesistemas-300x600.webp',
  ];
  const dir = path.join(ROOT, 'public', 'self-ads');
  const missing = expected.filter((f) => !fs.existsSync(path.join(dir, f)));
  if (missing.length > 0) throw new Error(`faltando: ${missing.join(', ')}`);
});

check('Configs dos sites tem bloco adsense', () => {
  const sitesDir = path.join(ROOT, 'sites');
  const slugs = fs.readdirSync(sitesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name);
  const missing = [];
  for (const slug of slugs) {
    const f = path.join(sitesDir, slug, 'config.json');
    if (!fs.existsSync(f)) continue;
    const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!cfg.adsense) missing.push(slug);
  }
  if (missing.length > 0) throw new Error(`${missing.length} sites sem adsense block: ${missing.join(', ')}`);
});

const failed = checks.filter((c) => !c.ok).length;
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`smoke-adsense: ${checks.length - failed}/${checks.length} pass`);
process.exit(failed > 0 ? 1 : 0);
