/**
 * smoke-post-deploy — valida URLs criticas dos 36 sites apos deploy.
 *
 * Para cada site (sites/*\/config.json), faz HEAD request em:
 *   - / (home)
 *   - /privacidade
 *   - /termos
 *   - /cookies (TASK-18)
 *   - /contato
 *   - /resultado (apenas Cat D com leadMagnet)
 *   - /quanto-custa /diagnostico (Cat D)
 *   - /lista-de-espera (Cat E)
 *   - /relatorio.pdf (se exists em sites/{slug}/public/)
 *
 * Falha (exit 1) se algum 4xx/5xx ou content-type inesperado.
 *
 * TASK-15 ST001 — gaps CL-049, CL-559, CL-642
 *
 * Usage:
 *   BASE_URL=https://exemplo.com npx tsx scripts/smoke-post-deploy.ts
 *   SLUGS_FILTER=d01,a01 npx tsx scripts/smoke-post-deploy.ts
 *   DOMAIN_TEMPLATE='https://{slug}.example.com' npx tsx scripts/smoke-post-deploy.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve('sites');
const REPORTS_DIR = path.resolve('output/reports');
const DOMAIN_TEMPLATE = process.env.DOMAIN_TEMPLATE ?? '';
const BASE_URL = process.env.BASE_URL ?? '';
const SLUGS_FILTER = (process.env.SLUGS_FILTER ?? '').split(',').filter(Boolean);
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 10_000);
const MIN_HTML_BYTES = 1024;

interface SiteConfig {
  slug: string;
  category: string;
  hasLeadMagnet: boolean;
  hasReportPdf: boolean;
  baseUrl: string;
}

interface UrlCheck {
  path: string;
  expectStatus: number;
  expectContent?: 'html' | 'pdf';
  minBytes?: number;
  required: boolean;
}

interface Result {
  slug: string;
  url: string;
  path: string;
  status: number | 'TIMEOUT' | 'NETWORK_ERROR';
  ok: boolean;
  message?: string;
}

function loadSites(): SiteConfig[] {
  const out: SiteConfig[] = [];
  if (!fs.existsSync(SITES_DIR)) return out;
  for (const slug of fs.readdirSync(SITES_DIR)) {
    if (slug.startsWith('_')) continue;
    if (SLUGS_FILTER.length > 0 && !SLUGS_FILTER.includes(slug.slice(0, 3))) continue;
    const cfgPath = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as {
        siteUrl?: string;
        category?: string;
        leadMagnet?: { enabled?: boolean };
      };
      const baseUrl = computeBaseUrl(slug, c.siteUrl);
      if (!baseUrl) continue;
      out.push({
        slug,
        category: c.category ?? '?',
        hasLeadMagnet: Boolean(c.leadMagnet?.enabled),
        hasReportPdf: fs.existsSync(path.join(SITES_DIR, slug, 'public', 'relatorio.pdf')),
        baseUrl,
      });
    } catch {
      /* skip */
    }
  }
  return out;
}

function computeBaseUrl(slug: string, siteUrl?: string): string | null {
  if (BASE_URL && SLUGS_FILTER.length > 0) return BASE_URL.replace(/\/$/, '');
  if (DOMAIN_TEMPLATE) return DOMAIN_TEMPLATE.replace('{slug}', slug.split('-')[0]).replace(/\/$/, '');
  if (BASE_URL) return BASE_URL.replace(/\/$/, '');
  if (siteUrl) return siteUrl.replace(/\/$/, '');
  return null;
}

function checksFor(site: SiteConfig): UrlCheck[] {
  const out: UrlCheck[] = [
    { path: '/', expectStatus: 200, expectContent: 'html', minBytes: MIN_HTML_BYTES, required: true },
    { path: '/privacidade', expectStatus: 200, expectContent: 'html', required: true },
    { path: '/termos', expectStatus: 200, expectContent: 'html', required: true },
    { path: '/cookies', expectStatus: 200, expectContent: 'html', required: true },
    { path: '/contato', expectStatus: 200, expectContent: 'html', required: true },
  ];
  if (site.category === 'D') {
    out.push({ path: '/quanto-custa', expectStatus: 200, expectContent: 'html', required: true });
    out.push({ path: '/diagnostico', expectStatus: 200, expectContent: 'html', required: true });
    if (site.hasLeadMagnet) {
      out.push({ path: '/resultado', expectStatus: 200, expectContent: 'html', required: true });
    }
  }
  if (site.category === 'E') {
    out.push({ path: '/lista-de-espera', expectStatus: 200, expectContent: 'html', required: true });
  }
  if (site.hasReportPdf) {
    out.push({ path: '/relatorio.pdf', expectStatus: 200, expectContent: 'pdf', required: false });
  }
  return out;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'GET', signal: ctrl.signal, redirect: 'manual' });
  } finally {
    clearTimeout(timer);
  }
}

async function check(site: SiteConfig, c: UrlCheck): Promise<Result> {
  const url = `${site.baseUrl}${c.path}`;
  try {
    const res = await fetchWithTimeout(url);
    const status = res.status;
    const ok = status === c.expectStatus;
    let message = '';
    if (!ok) message = `expected ${c.expectStatus}, got ${status}`;
    if (c.expectContent === 'html' && ok) {
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('text/html')) {
        return { slug: site.slug, url, path: c.path, status, ok: false, message: `content-type=${ct}` };
      }
    }
    if (c.expectContent === 'pdf' && ok) {
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('pdf')) {
        return { slug: site.slug, url, path: c.path, status, ok: false, message: `content-type=${ct}` };
      }
    }
    if (c.minBytes && ok) {
      const cl = Number(res.headers.get('content-length') ?? 0);
      if (cl > 0 && cl < c.minBytes) {
        return {
          slug: site.slug,
          url,
          path: c.path,
          status,
          ok: false,
          message: `content-length=${cl} < min ${c.minBytes}`,
        };
      }
    }
    return { slug: site.slug, url, path: c.path, status, ok, message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort')) {
      return { slug: site.slug, url, path: c.path, status: 'TIMEOUT', ok: false, message: 'request timeout' };
    }
    return { slug: site.slug, url, path: c.path, status: 'NETWORK_ERROR', ok: false, message: msg.slice(0, 120) };
  }
}

async function main(): Promise<void> {
  const sites = loadSites();
  if (sites.length === 0) {
    console.warn('[smoke] nenhum site encontrado');
    process.exit(0);
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  console.log(`[smoke] auditando ${sites.length} sites — timeout=${TIMEOUT_MS}ms`);

  const all: Result[] = [];
  let requiredFails = 0;

  for (const site of sites) {
    const checks = checksFor(site);
    const results = await Promise.all(checks.map((c) => check(site, c)));
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const c = checks[i];
      all.push(r);
      const tag = r.ok ? 'OK' : 'FAIL';
      console.log(`[smoke] ${tag} ${site.slug}${c.path} -> ${r.status}${r.message ? ' (' + r.message + ')' : ''}`);
      if (!r.ok && c.required) requiredFails++;
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const reportFile = path.join(REPORTS_DIR, `smoke-${date}.json`);
  fs.writeFileSync(reportFile, JSON.stringify({ date, total: all.length, fails: requiredFails, results: all }, null, 2));
  console.log(`[smoke] relatorio: ${reportFile}`);

  if (requiredFails > 0) {
    console.error(`[smoke] FAIL — ${requiredFails} checks obrigatorios falharam`);
    process.exit(1);
  }
  console.log(`[smoke] OK — ${all.length} URLs validadas`);
}

main().catch((e) => {
  console.error('[smoke] erro fatal:', e);
  process.exit(1);
});
