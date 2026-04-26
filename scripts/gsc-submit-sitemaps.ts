/**
 * Submete sitemap.xml de todos os sites ao Google Search Console.
 * Requer: GSC_CREDENTIALS apontando para service account JSON.
 * Deps: npm i google-auth-library googleapis
 * Usage: npx tsx scripts/gsc-submit-sitemaps.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve('sites');
const CREDENTIALS = process.env.GSC_CREDENTIALS ?? 'secrets/gsc-service-account.json';

interface SiteEntry {
  slug: string;
  siteUrl: string;
}

function loadSites(): SiteEntry[] {
  const out: SiteEntry[] = [];
  if (!fs.existsSync(SITES_DIR)) return out;
  for (const slug of fs.readdirSync(SITES_DIR)) {
    const cfg = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfg)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(cfg, 'utf-8')) as { siteUrl?: string };
      if (c.siteUrl) out.push({ slug, siteUrl: c.siteUrl.replace(/\/$/, '') });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function submit(siteUrl: string, sitemapUrl: string): Promise<void> {
  // Lazy import para evitar falha em ambientes sem deps.
  const { google } = await import('googleapis');
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    keyFile: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  const client = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: client as never });
  await webmasters.sitemaps.submit({ siteUrl, feedpath: sitemapUrl });
}

async function main() {
  const sites = loadSites();
  if (sites.length === 0) {
    console.warn('[gsc] nenhum site encontrado');
    return;
  }
  if (!fs.existsSync(CREDENTIALS)) {
    console.error(`[gsc] credenciais ausentes em ${CREDENTIALS}`);
    process.exit(1);
  }
  let ok = 0;
  let fail = 0;
  for (const s of sites) {
    const sitemap = `${s.siteUrl}/sitemap.xml`;
    try {
      await submit(s.siteUrl, sitemap);
      console.log(`[gsc] ok ${s.slug} -> ${sitemap}`);
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[gsc] fail ${s.slug}: ${msg}`);
      fail++;
    }
  }
  console.log(`[gsc] total ok=${ok} fail=${fail}`);
  if (fail > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
