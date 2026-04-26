#!/usr/bin/env tsx
/**
 * scripts/ssl-expiry-watch.ts (CL-630)
 *
 * Para cada dominio em sites/*\/config.json (campo `domain` se existir,
 * senao deriva subdominio Hostinger {slug}.systemforge.com.br),
 * abre conexao TLS e le `cert.valid_to`. Alerta se <30d para vencer.
 *
 * Exit 1 se algum cert expirando — usado em GitHub Actions cron.
 */
import * as tls from 'node:tls';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DAYS_THRESHOLD = 30;

interface CheckResult {
  domain: string;
  slug: string;
  valid_to: Date | null;
  daysLeft: number | null;
  error?: string;
}

function listDomains(): { slug: string; domain: string }[] {
  const sitesDir = resolve(process.cwd(), 'sites');
  if (!existsSync(sitesDir)) {
    console.error('[ssl-watch] Pasta sites/ nao encontrada.');
    process.exit(2);
  }
  const out: { slug: string; domain: string }[] = [];
  for (const entry of readdirSync(sitesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const cfgPath = join(sitesDir, entry.name, 'config.json');
    if (!existsSync(cfgPath)) continue;
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, 'utf8')) as Record<string, unknown>;
      const domain =
        typeof cfg.domain === 'string' && cfg.domain.length > 0
          ? cfg.domain
          : `${entry.name}.systemforge.com.br`;
      out.push({ slug: entry.name, domain });
    } catch {
      // skip invalido
    }
  }
  return out;
}

function checkOne(domain: string, slug: string): Promise<CheckResult> {
  return new Promise((resolveP) => {
    const opts: tls.ConnectionOptions = {
      host: domain,
      port: 443,
      servername: domain,
      timeout: 10_000,
      rejectUnauthorized: false,
    };
    const socket = tls.connect(opts, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert || !cert.valid_to) {
        resolveP({ domain, slug, valid_to: null, daysLeft: null, error: 'no-cert' });
        return;
      }
      const validTo = new Date(cert.valid_to);
      const daysLeft = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      resolveP({ domain, slug, valid_to: validTo, daysLeft });
    });
    socket.on('error', (err) => {
      resolveP({ domain, slug, valid_to: null, daysLeft: null, error: err.message });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolveP({ domain, slug, valid_to: null, daysLeft: null, error: 'timeout' });
    });
  });
}

async function main() {
  const domains = listDomains();
  console.log(`[ssl-watch] Verificando ${domains.length} dominios (threshold ${DAYS_THRESHOLD}d)`);
  const results = await Promise.all(domains.map((d) => checkOne(d.domain, d.slug)));

  console.log();
  console.log('Slug'.padEnd(36) + 'Dominio'.padEnd(40) + 'Valid to'.padEnd(14) + 'Days');
  console.log('-'.repeat(98));
  let expiring = 0;
  let errors = 0;
  for (const r of results.sort((a, b) => (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999))) {
    if (r.error) {
      errors++;
      console.log(r.slug.padEnd(36) + r.domain.padEnd(40) + 'ERROR'.padEnd(14) + `(${r.error})`);
      continue;
    }
    const flag = r.daysLeft !== null && r.daysLeft <= DAYS_THRESHOLD ? '!! EXPIRA' : '';
    if (flag) expiring++;
    console.log(
      r.slug.padEnd(36) +
        r.domain.padEnd(40) +
        (r.valid_to ? r.valid_to.toISOString().slice(0, 10) : '?').padEnd(14) +
        `${r.daysLeft}d ${flag}`,
    );
  }

  console.log();
  console.log(`[ssl-watch] expiring=${expiring} errors=${errors} total=${results.length}`);

  if (expiring > 0) {
    console.error(`FAIL: ${expiring} cert(s) expirando em <${DAYS_THRESHOLD}d.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[ssl-watch] Fatal:', err);
  process.exit(2);
});
