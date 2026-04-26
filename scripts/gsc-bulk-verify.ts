/**
 * Bulk verify de propriedades GSC via TXT record DNS.
 *
 * Para cada site em sites/*\/config.json:
 *   1. Cria TXT record `google-site-verification=<token>` via DNS API (Hostinger ou Cloudflare)
 *   2. Aguarda propagacao (default 5min, configuravel)
 *   3. Submete request de verificacao GSC
 *   4. Retorna status por site
 *
 * Saida: JSON em stdout + relatorio markdown em output/reports/gsc-bulk-verify-{date}.md
 *
 * Variaveis de ambiente requeridas:
 *   - GSC_CREDENTIALS=secrets/gsc-service-account.json
 *   - DNS_PROVIDER=hostinger | cloudflare
 *   - DNS_API_TOKEN=...
 *   - DNS_PROPAGATION_WAIT_MS=300000   (default 5min)
 *
 * Deps: npm i googleapis google-auth-library
 *
 * Usage:
 *   GSC_CREDENTIALS=secrets/gsc-service-account.json \
 *   DNS_PROVIDER=cloudflare DNS_API_TOKEN=xxxx \
 *   npx tsx scripts/gsc-bulk-verify.ts [--dry-run] [--site <slug>]
 *
 * TASK-14 ST001 — gaps CL-024, CL-111, CL-256, CL-262, CL-505-508
 */
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';

const SITES_DIR = path.resolve('sites');
const REPORTS_DIR = path.resolve('output/reports');
const CREDENTIALS = process.env.GSC_CREDENTIALS ?? 'secrets/gsc-service-account.json';
const DNS_PROVIDER = (process.env.DNS_PROVIDER ?? 'hostinger') as 'hostinger' | 'cloudflare';
const DNS_API_TOKEN = process.env.DNS_API_TOKEN ?? '';
const PROPAGATION_WAIT = Number(process.env.DNS_PROPAGATION_WAIT_MS ?? 5 * 60 * 1000);
const DRY_RUN = process.argv.includes('--dry-run');
const SITE_FILTER = (() => {
  const i = process.argv.indexOf('--site');
  return i >= 0 ? process.argv[i + 1] : null;
})();

interface SiteEntry {
  slug: string;
  domain: string;
  siteUrl: string;
}

interface VerifyResult {
  slug: string;
  domain: string;
  status: 'verified' | 'pending' | 'failed' | 'skipped';
  message?: string;
  txtRecord?: string;
}

function loadSites(): SiteEntry[] {
  const out: SiteEntry[] = [];
  if (!fs.existsSync(SITES_DIR)) return out;
  for (const slug of fs.readdirSync(SITES_DIR)) {
    if (slug.startsWith('_')) continue;
    if (SITE_FILTER && slug !== SITE_FILTER) continue;
    const cfg = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfg)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(cfg, 'utf-8')) as { siteUrl?: string };
      if (!c.siteUrl) continue;
      const url = c.siteUrl.replace(/\/$/, '');
      const domain = new URL(url).hostname;
      out.push({ slug, domain, siteUrl: url });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function getVerificationToken(siteUrl: string): Promise<string> {
  const { google } = await import('googleapis');
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    keyFile: CREDENTIALS,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/siteverification',
    ],
  });
  const client = await auth.getClient();
  const verification = google.siteVerification({ version: 'v1', auth: client as never });
  const res = await verification.webResource.getToken({
    requestBody: {
      site: { type: 'INET_DOMAIN', identifier: new URL(siteUrl).hostname },
      verificationMethod: 'DNS_TXT',
    },
  });
  if (!res.data.token) throw new Error('GSC nao retornou token');
  return res.data.token;
}

async function createDnsTxtRecord(domain: string, value: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`[dry-run] criar TXT em ${domain} = ${value.slice(0, 24)}...`);
    return;
  }

  if (DNS_PROVIDER === 'cloudflare') {
    const zoneRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(domain)}`,
      { headers: { Authorization: `Bearer ${DNS_API_TOKEN}` } },
    );
    if (!zoneRes.ok) throw new Error(`CF zone lookup ${zoneRes.status}`);
    const zone = (await zoneRes.json()) as { result: Array<{ id: string }> };
    const zoneId = zone.result?.[0]?.id;
    if (!zoneId) throw new Error(`CF zone nao encontrada para ${domain}`);

    const create = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DNS_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'TXT', name: domain, content: value, ttl: 300 }),
      },
    );
    if (!create.ok) {
      const txt = await create.text();
      throw new Error(`CF create TXT ${create.status}: ${txt.slice(0, 200)}`);
    }
    return;
  }

  // hostinger fallback: documentar via PENDING-ACTIONS, sem API publica estavel
  throw new Error(
    `DNS_PROVIDER=${DNS_PROVIDER} nao tem API estavel — registrar TXT manualmente: ${domain} TXT ${value}`,
  );
}

async function verifyWithGsc(siteUrl: string): Promise<boolean> {
  if (DRY_RUN) {
    console.log(`[dry-run] GSC verify ${siteUrl}`);
    return true;
  }
  const { google } = await import('googleapis');
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    keyFile: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/siteverification'],
  });
  const client = await auth.getClient();
  const verification = google.siteVerification({ version: 'v1', auth: client as never });
  try {
    await verification.webResource.insert({
      verificationMethod: 'DNS_TXT',
      requestBody: {
        site: { type: 'INET_DOMAIN', identifier: new URL(siteUrl).hostname },
      },
    });
    return true;
  } catch (e) {
    console.warn(`[gsc] verify failed ${siteUrl}:`, e instanceof Error ? e.message : e);
    return false;
  }
}

async function processSite(site: SiteEntry): Promise<VerifyResult> {
  console.log(`[gsc-bulk] ${site.slug} (${site.domain})`);

  if (!CREDENTIALS || !fs.existsSync(CREDENTIALS)) {
    return {
      slug: site.slug,
      domain: site.domain,
      status: 'skipped',
      message: 'GSC credentials ausentes (PENDING-ACTIONS sentry-setup)',
    };
  }

  if (DNS_PROVIDER !== 'cloudflare' && !DRY_RUN) {
    return {
      slug: site.slug,
      domain: site.domain,
      status: 'skipped',
      message: `DNS_PROVIDER=${DNS_PROVIDER} sem API estavel — registrar TXT manualmente`,
    };
  }

  try {
    const token = await getVerificationToken(site.siteUrl);
    await createDnsTxtRecord(site.domain, token);
    return { slug: site.slug, domain: site.domain, status: 'pending', txtRecord: token };
  } catch (e) {
    return {
      slug: site.slug,
      domain: site.domain,
      status: 'failed',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

function writeReport(results: VerifyResult[]): string {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(REPORTS_DIR, `gsc-bulk-verify-${date}.md`);

  const lines = [
    `# GSC Bulk Verify — ${date}`,
    '',
    `**Provider DNS:** ${DNS_PROVIDER} | **Dry-run:** ${DRY_RUN}`,
    `**Total sites:** ${results.length}`,
    '',
    '| Slug | Dominio | Status | Detalhe |',
    '|---|---|---|---|',
    ...results.map(
      (r) => `| ${r.slug} | ${r.domain} | ${r.status} | ${(r.message ?? r.txtRecord ?? '').slice(0, 80)} |`,
    ),
    '',
    `## Sumario`,
    '',
    `- verified: ${results.filter((r) => r.status === 'verified').length}`,
    `- pending: ${results.filter((r) => r.status === 'pending').length}`,
    `- failed: ${results.filter((r) => r.status === 'failed').length}`,
    `- skipped: ${results.filter((r) => r.status === 'skipped').length}`,
  ];
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf-8');
  return file;
}

async function main() {
  const sites = loadSites();
  if (sites.length === 0) {
    console.warn('[gsc-bulk] nenhum site encontrado em sites/');
    process.exit(0);
  }

  console.log(`[gsc-bulk] processando ${sites.length} sites — provider=${DNS_PROVIDER} dry-run=${DRY_RUN}`);

  const results: VerifyResult[] = [];

  // 1. Criar TXT records (sequencial para nao saturar API DNS)
  for (const site of sites) {
    results.push(await processSite(site));
  }

  // 2. Aguardar propagacao DNS
  const pending = results.filter((r) => r.status === 'pending');
  if (pending.length > 0 && !DRY_RUN) {
    console.log(`[gsc-bulk] aguardando ${PROPAGATION_WAIT / 1000}s para propagacao DNS...`);
    await wait(PROPAGATION_WAIT);
  }

  // 3. Verificar
  for (const r of results) {
    if (r.status !== 'pending') continue;
    const ok = await verifyWithGsc(`https://${r.domain}`);
    r.status = ok ? 'verified' : 'failed';
    if (!ok) r.message = 'GSC verify retornou erro — TXT pode nao ter propagado; tentar novamente em 1h';
  }

  const report = writeReport(results);
  console.log(`[gsc-bulk] relatorio: ${report}`);
  console.log(JSON.stringify(results, null, 2));

  const failedCount = results.filter((r) => r.status === 'failed').length;
  process.exit(failedCount > 0 ? 2 : 0);
}

main().catch((e) => {
  console.error('[gsc-bulk] erro fatal:', e);
  process.exit(1);
});
