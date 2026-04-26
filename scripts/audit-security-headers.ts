/**
 * audit-security-headers — valida headers de seguranca em todos os 36 dominios.
 *
 * Para cada sites/{slug}/config.json com siteUrl, faz HEAD request e valida:
 *   - Strict-Transport-Security (HSTS)
 *   - X-Frame-Options
 *   - X-Content-Type-Options: nosniff
 *   - Referrer-Policy
 *   - Permissions-Policy (presente)
 *   - Redirect HTTP -> HTTPS (curl em http:// retorna 301)
 *
 * TASK-21 ST002 — gaps CL-638, CL-639
 *
 * Usage:
 *   npx tsx scripts/audit-security-headers.ts [--strict] [--site <slug>]
 */
import fs from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve('sites');
const REPORTS_DIR = path.resolve('output/reports');
const STRICT = process.argv.includes('--strict');
const SITE_FILTER = (() => {
  const i = process.argv.indexOf('--site');
  return i >= 0 ? process.argv[i + 1] : null;
})();

interface CheckResult {
  slug: string;
  url: string;
  ok: boolean;
  details: Array<{ name: string; ok: boolean; value?: string; expected?: string }>;
}

const REQUIRED_HEADERS: Array<{ name: string; validate: (value: string | null) => boolean; expected: string }> = [
  {
    name: 'strict-transport-security',
    validate: (v) => !!v && /max-age=\d+/i.test(v) && Number(v.match(/max-age=(\d+)/)?.[1] ?? 0) >= 86400,
    expected: 'max-age >= 86400',
  },
  {
    name: 'x-frame-options',
    validate: (v) => !!v && /^(DENY|SAMEORIGIN)$/i.test(v.trim()),
    expected: 'DENY or SAMEORIGIN',
  },
  {
    name: 'x-content-type-options',
    validate: (v) => !!v && /nosniff/i.test(v),
    expected: 'nosniff',
  },
  {
    name: 'referrer-policy',
    validate: (v) => !!v && /^[a-z-]+$/.test(v.trim()),
    expected: 'qualquer policy nao vazia',
  },
  {
    name: 'permissions-policy',
    validate: (v) => !!v && v.length > 0,
    expected: 'qualquer valor (presente)',
  },
];

function loadSites(): Array<{ slug: string; url: string }> {
  const out: Array<{ slug: string; url: string }> = [];
  if (!fs.existsSync(SITES_DIR)) return out;
  for (const slug of fs.readdirSync(SITES_DIR)) {
    if (slug.startsWith('_')) continue;
    if (SITE_FILTER && slug !== SITE_FILTER) continue;
    const cfg = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfg)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(cfg, 'utf-8')) as { siteUrl?: string };
      if (c.siteUrl) out.push({ slug, url: c.siteUrl.replace(/\/$/, '') });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function checkSite(slug: string, url: string): Promise<CheckResult> {
  const details: CheckResult['details'] = [];

  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    const headers = res.headers;
    for (const h of REQUIRED_HEADERS) {
      const value = headers.get(h.name);
      details.push({
        name: h.name,
        ok: h.validate(value),
        value: value ?? '(missing)',
        expected: h.expected,
      });
    }

    // HTTP -> HTTPS redirect check
    const httpUrl = url.replace(/^https:/, 'http:');
    if (httpUrl !== url) {
      try {
        const httpRes = await fetch(httpUrl, { method: 'HEAD', redirect: 'manual' });
        const isRedirect = httpRes.status >= 300 && httpRes.status < 400;
        const loc = httpRes.headers.get('location') ?? '';
        const ok = isRedirect && loc.startsWith('https://');
        details.push({
          name: 'http-to-https-redirect',
          ok,
          value: `${httpRes.status} -> ${loc || '(no location)'}`,
          expected: '301/302 + Location: https://...',
        });
      } catch {
        details.push({ name: 'http-to-https-redirect', ok: false, value: 'fetch error' });
      }
    }
  } catch (e) {
    details.push({
      name: 'request',
      ok: false,
      value: e instanceof Error ? e.message : String(e),
      expected: 'HEAD response 2xx/3xx',
    });
  }

  const ok = details.every((d) => d.ok);
  return { slug, url, ok, details };
}

async function main(): Promise<void> {
  const sites = loadSites();
  if (sites.length === 0) {
    console.warn('[sec-headers] nenhum site com siteUrl encontrado');
    process.exit(0);
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  console.log(`[sec-headers] auditando ${sites.length} sites...`);

  const results: CheckResult[] = [];
  for (const s of sites) {
    const r = await checkSite(s.slug, s.url);
    results.push(r);
    const tag = r.ok ? 'OK  ' : 'FAIL';
    console.log(`[sec-headers] ${tag} ${s.slug} -> ${s.url}`);
    if (!r.ok) {
      for (const d of r.details.filter((x) => !x.ok)) {
        console.log(`         - ${d.name}: ${d.value} (esperado: ${d.expected})`);
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(REPORTS_DIR, `security-headers-${date}.json`);
  fs.writeFileSync(file, JSON.stringify({ date, results }, null, 2));
  console.log(`[sec-headers] relatorio: ${file}`);

  const fails = results.filter((r) => !r.ok);
  console.log(`[sec-headers] ${results.length - fails.length}/${results.length} sites passing`);

  if (STRICT && fails.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error('[sec-headers] erro fatal:', e);
  process.exit(1);
});
