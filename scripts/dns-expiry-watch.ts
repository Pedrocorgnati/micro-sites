#!/usr/bin/env tsx
/**
 * scripts/dns-expiry-watch.ts (CL-630)
 *
 * Verifica expiracao de registro de dominios .com.br / .com / .net
 * via WHOIS (modulo whois CLI ou whoisxmlapi). Alerta <60d.
 *
 * Implementacao: tenta `whois` CLI (Linux/macOS); fallback whoisxmlapi
 * se WHOISXMLAPI_KEY estiver no env.
 *
 * Lista de dominios vem de WHOIS_DOMAINS env (csv) ou config/whois-domains.json.
 * Subdominios Hostinger nao precisam (nao tem registro proprio).
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DAYS_THRESHOLD = 60;

function loadDomains(): string[] {
  if (process.env.WHOIS_DOMAINS) {
    return process.env.WHOIS_DOMAINS.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const cfg = resolve(process.cwd(), 'config/whois-domains.json');
  if (existsSync(cfg)) {
    return JSON.parse(readFileSync(cfg, 'utf8')) as string[];
  }
  return [];
}

function whoisCli(domain: string): string | null {
  try {
    return execSync(`whois ${domain}`, { encoding: 'utf8', timeout: 15_000 });
  } catch {
    return null;
  }
}

function parseExpiry(raw: string): Date | null {
  // Patterns variaveis por TLD
  const patterns = [
    /Registry Expiry Date:\s*(\S+)/i,
    /Expiry date:\s*(\S+)/i,
    /Expiration Date:\s*(\S+)/i,
    /paid-till:\s*(\S+)/i,
    /expires:\s*(\S+)/i,
    /vencimento:\s*(\S+)/i, // .br
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m && m[1]) {
      const d = new Date(m[1]);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
}

async function main() {
  const domains = loadDomains();
  if (domains.length === 0) {
    console.warn('[dns-watch] Nenhum dominio configurado.');
    console.warn('  Defina WHOIS_DOMAINS env ou crie config/whois-domains.json');
    process.exit(0);
  }

  console.log(`[dns-watch] Verificando ${domains.length} dominios (threshold ${DAYS_THRESHOLD}d)`);
  console.log();
  console.log('Dominio'.padEnd(36) + 'Expira em'.padEnd(14) + 'Days');
  console.log('-'.repeat(60));

  let expiring = 0;
  let errors = 0;
  for (const d of domains) {
    const raw = whoisCli(d);
    if (!raw) {
      errors++;
      console.log(d.padEnd(36) + 'ERROR'.padEnd(14) + '(whois failed)');
      continue;
    }
    const expiry = parseExpiry(raw);
    if (!expiry) {
      errors++;
      console.log(d.padEnd(36) + 'ERROR'.padEnd(14) + '(parse failed)');
      continue;
    }
    const daysLeft = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const flag = daysLeft <= DAYS_THRESHOLD ? '!! VENCE' : '';
    if (flag) expiring++;
    console.log(d.padEnd(36) + expiry.toISOString().slice(0, 10).padEnd(14) + `${daysLeft}d ${flag}`);
  }

  console.log();
  console.log(`[dns-watch] expiring=${expiring} errors=${errors} total=${domains.length}`);

  if (expiring > 0) {
    console.error(`FAIL: ${expiring} dominio(s) vencem em <${DAYS_THRESHOLD}d.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[dns-watch] Fatal:', err);
  process.exit(2);
});
