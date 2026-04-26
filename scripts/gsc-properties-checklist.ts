/**
 * Gera checklist consolidado das 36 propriedades GSC.
 *
 * Cruza:
 *   - sites/*\/config.json (lista esperada)
 *   - GSC API webmasters.sites.list (lista atual)
 *   - deploy-map (saber quais estao em producao)
 *
 * Output: output/reports/gsc-properties-status.md
 *
 * Variaveis de ambiente:
 *   - GSC_CREDENTIALS=secrets/gsc-service-account.json
 *
 * Usage:
 *   npx tsx scripts/gsc-properties-checklist.ts
 *
 * TASK-14 ST002 — gaps CL-256, CL-262, CL-505-508
 */
import fs from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve('sites');
const REPORTS_DIR = path.resolve('output/reports');
const CREDENTIALS = process.env.GSC_CREDENTIALS ?? 'secrets/gsc-service-account.json';

interface ExpectedSite {
  slug: string;
  domain: string;
  category: string;
  hasBlog: boolean;
}

interface GscSite {
  identifier: string;
  permissionLevel: string;
}

function loadExpected(): ExpectedSite[] {
  const out: ExpectedSite[] = [];
  if (!fs.existsSync(SITES_DIR)) return out;
  for (const slug of fs.readdirSync(SITES_DIR)) {
    if (slug.startsWith('_')) continue;
    const cfg = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfg)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(cfg, 'utf-8')) as {
        siteUrl?: string;
        category?: string;
        hasBlog?: boolean;
      };
      if (!c.siteUrl) continue;
      out.push({
        slug,
        domain: new URL(c.siteUrl).hostname,
        category: c.category ?? '?',
        hasBlog: Boolean(c.hasBlog),
      });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function loadGscSites(): Promise<GscSite[]> {
  if (!fs.existsSync(CREDENTIALS)) {
    console.warn(`[gsc-checklist] credenciais ausentes em ${CREDENTIALS} — usando lista vazia`);
    return [];
  }
  try {
    const { google } = await import('googleapis');
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      keyFile: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    const client = await auth.getClient();
    const webmasters = google.webmasters({ version: 'v3', auth: client as never });
    const res = await webmasters.sites.list({});
    return (res.data.siteEntry ?? []).map((s) => ({
      identifier: s.siteUrl ?? '',
      permissionLevel: s.permissionLevel ?? 'unknown',
    }));
  } catch (e) {
    console.warn('[gsc-checklist] erro ao listar sites:', e instanceof Error ? e.message : e);
    return [];
  }
}

function normalize(url: string): string {
  return url.replace(/\/$/, '').replace(/^sc-domain:/, '').replace(/^https?:\/\//, '');
}

async function main() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const expected = loadExpected();
  const gscSites = await loadGscSites();

  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(REPORTS_DIR, 'gsc-properties-status.md');

  const lines: string[] = [
    `# GSC Properties Status — ${date}`,
    '',
    `**Total esperado (sites/*\/config.json):** ${expected.length}`,
    `**Total no GSC:** ${gscSites.length}`,
    '',
    '## Checklist',
    '',
    '| Slug | Categoria | Dominio | GSC | Permission | Blog? |',
    '|---|---|---|---|---|---|',
  ];

  let presentInGsc = 0;
  for (const site of expected.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const inGsc = gscSites.find((g) => normalize(g.identifier).includes(site.domain));
    if (inGsc) presentInGsc++;
    lines.push(
      `| ${site.slug} | ${site.category} | ${site.domain} | ${inGsc ? '[x]' : '[ ]'} | ${inGsc?.permissionLevel ?? '-'} | ${site.hasBlog ? '[x]' : '[ ]'} |`,
    );
  }

  // Inverso: GSC orphans (no GSC mas nao em sites/)
  const orphans = gscSites.filter(
    (g) => !expected.some((e) => normalize(g.identifier).includes(e.domain)),
  );
  if (orphans.length > 0) {
    lines.push('', '## GSC orphans (nao tem config.json local)', '');
    for (const o of orphans) {
      lines.push(`- ${o.identifier} (${o.permissionLevel})`);
    }
  }

  lines.push(
    '',
    '## Sumario',
    '',
    `- Em GSC: ${presentInGsc}/${expected.length} (${Math.round((presentInGsc / Math.max(expected.length, 1)) * 100)}%)`,
    `- Pendentes: ${expected.length - presentInGsc}`,
    `- Orphans: ${orphans.length}`,
    '',
    `Gerado em ${new Date().toISOString()} por \`scripts/gsc-properties-checklist.ts\``,
  );

  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf-8');
  console.log(`[gsc-checklist] ${file}`);

  // Tambem exporta JSON para uso em workflow
  const jsonFile = path.join(REPORTS_DIR, 'gsc-properties-status.json');
  fs.writeFileSync(
    jsonFile,
    JSON.stringify(
      {
        date,
        total_expected: expected.length,
        total_in_gsc: gscSites.length,
        present_in_gsc: presentInGsc,
        pending: expected.length - presentInGsc,
        orphans: orphans.length,
        sites: expected.map((e) => ({
          slug: e.slug,
          domain: e.domain,
          in_gsc: gscSites.some((g) => normalize(g.identifier).includes(e.domain)),
        })),
      },
      null,
      2,
    ),
    'utf-8',
  );
}

main().catch((e) => {
  console.error('[gsc-checklist] erro fatal:', e);
  process.exit(1);
});
