// CL-558 — verifica HEAD do wa.me deep link de cada site
// Exit codes: 0 ok, 1 algum link broken, 2 erro de leitura
//
// Uso: tsx scripts/synthetic-whatsapp-link.ts [--site=<slug>]

import fs from 'node:fs';
import path from 'node:path';
import { buildWhatsAppUrl } from '../src/lib/whatsapp';

type SiteConfig = {
  slug?: string;
  cta?: { whatsappNumber?: string; whatsappMessage?: string };
};

const SITES_DIR = path.join(process.cwd(), 'sites');
const SITE_FILTER = process.argv.find((a) => a.startsWith('--site='))?.split('=')[1];

async function checkLink(url: string): Promise<{ ok: boolean; status: number; reason?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: ctrl.signal });
    clearTimeout(timer);
    const ok = res.status === 200 || (res.status >= 300 && res.status < 400);
    return { ok, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, reason: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  if (!fs.existsSync(SITES_DIR)) {
    console.error('[synthetic-wa] sites/ nao existe');
    process.exit(2);
  }

  const slugs = fs
    .readdirSync(SITES_DIR)
    .filter((d) => !d.startsWith('_') && fs.statSync(path.join(SITES_DIR, d)).isDirectory());

  const results: Array<{ slug: string; url: string; ok: boolean; status: number; reason?: string }> = [];

  for (const slug of slugs) {
    if (SITE_FILTER && slug !== SITE_FILTER) continue;
    const cfgPath = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as SiteConfig;
    const number = cfg.cta?.whatsappNumber;
    if (!number) continue;
    const url = buildWhatsAppUrl(number, cfg.cta?.whatsappMessage ?? 'Ola');
    const r = await checkLink(url);
    results.push({ slug, url, ...r });
    process.stderr.write(`[synthetic-wa] ${slug} ${r.ok ? 'OK' : 'FAIL'} status=${r.status}${r.reason ? ` (${r.reason})` : ''}\n`);
  }

  const broken = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, broken: broken.length, items: results }, null, 2));
  process.exit(broken.length > 0 ? 1 : 0);
}

main();
