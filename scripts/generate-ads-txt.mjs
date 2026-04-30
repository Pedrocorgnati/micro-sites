#!/usr/bin/env node
/**
 * ADS-43 — Gerador de public/ads.txt em prebuild.
 *
 * Decisao DEC-02: arquivo estatico em public/, gerado a partir da SoT
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID. Static export do Next 16 nao suporta
 * route handler com Request, e public/ads.txt e mais simples + auditavel.
 *
 * Guard: falha se app/ads.txt/route.ts existir (colisao).
 *
 * Idempotente: re-roda em todo build, sobrescreve. Versionamento via .gitignore.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TARGET = path.join(PUBLIC_DIR, 'ads.txt');
const COLLISION = path.join(ROOT, 'src', 'app', 'ads.txt', 'route.ts');

// ADS-REV-01 — carrega .env via @next/env (mesma lib que o Next usa).
// Em CI o env pode vir do secret manager (process.env ja populado), e essa
// chamada e idempotente — nao sobrescreve valores ja presentes.
try {
  const { loadEnvConfig } = await import('@next/env');
  loadEnvConfig(ROOT);
} catch {
  // @next/env nao instalado; fallback ao process.env cru.
}

// ADS-REV-03 — em production, ausencia de clientId DEVE falhar build.
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';
const IS_PRODUCTION_BUILD = APP_ENV === 'production' || process.env.CI === 'true';

// Guard de colisao (INV-ADS-04).
if (fs.existsSync(COLLISION)) {
  console.error(`[ads-txt] ERRO: ${COLLISION} existe. Static export usa public/ads.txt; remova o route handler.`);
  process.exit(1);
}

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? '';
const valid = /^ca-pub-\d{16}$/.test(clientId);

if (!valid) {
  if (IS_PRODUCTION_BUILD) {
    // ADS-REV-03 — bloqueia build em production/CI sem clientId valido.
    console.error('[ads-txt] ERRO: NEXT_PUBLIC_ADSENSE_CLIENT_ID ausente/invalido em production/CI.');
    console.error('  set NEXT_PUBLIC_APP_ENV=development para builds locais sem AdSense.');
    process.exit(1);
  }
  // Modo non-blocking dev: placeholder para nao quebrar local sem AdSense.
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(TARGET, '# ads.txt placeholder — set NEXT_PUBLIC_ADSENSE_CLIENT_ID to enable\n', 'utf8');
  console.warn('[ads-txt] NEXT_PUBLIC_ADSENSE_CLIENT_ID ausente/invalido (dev); placeholder gerado.');
  process.exit(0);
}

// Formato canonico: "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
// f08c47fec0942fa0 = certification authority ID Google (publico, nao secreto).
const pubId = clientId.replace(/^ca-/, '');
const content = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(TARGET, content, 'utf8');
console.log(`[ads-txt] gerado em public/ads.txt (${pubId})`);
