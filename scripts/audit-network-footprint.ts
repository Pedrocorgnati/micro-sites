/**
 * audit-network-footprint.ts
 *
 * Detecta padroes que podem vazar "rede de sites" para Google.
 * Gap CL-079 — TASK-1 ST003.
 *
 * Checks:
 *   1. crossLinks count per site          (threshold: >3 alerta)
 *   2. Mega-menu listing many sites       (threshold: >5 alerta)
 *   3. Footer listing all sites           (threshold: >=N_SITES alerta)
 *
 * Exit code: 0 = limpo, 1 = violacoes detectadas.
 * Output: console + output/audit-footprint-{YYYY-MM-DD}.md.
 */

import fs from 'fs';
import path from 'path';

const SITES_ROOT = path.join(process.cwd(), 'sites');
const SRC_COMPONENTS = path.join(process.cwd(), 'src', 'components');
const OUTPUT_ROOT = path.join(process.cwd(), 'output');

const CROSSLINKS_THRESHOLD = 3;
const MEGA_MENU_THRESHOLD = 5;

interface SiteConfig {
  slug: string;
  crossLinks?: Array<{ href: string; anchor: string; context: string }>;
}

interface Alert {
  severity: 'error' | 'warning';
  site?: string;
  rule: string;
  message: string;
}

function loadSites(): SiteConfig[] {
  if (!fs.existsSync(SITES_ROOT)) {
    throw new Error(`sites/ nao encontrado em ${SITES_ROOT}`);
  }
  const entries = fs
    .readdirSync(SITES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'));

  const sites: SiteConfig[] = [];
  for (const dir of entries) {
    const configPath = path.join(SITES_ROOT, dir.name, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as SiteConfig;
      sites.push({ ...parsed, slug: parsed.slug ?? dir.name });
    } catch (err) {
      throw new Error(`Falha ao parsear ${configPath}: ${(err as Error).message}`);
    }
  }
  return sites;
}

function auditCrossLinks(sites: SiteConfig[]): Alert[] {
  const alerts: Alert[] = [];
  for (const site of sites) {
    const count = site.crossLinks?.length ?? 0;
    if (count > CROSSLINKS_THRESHOLD) {
      alerts.push({
        severity: 'error',
        site: site.slug,
        rule: 'cross-links-excess',
        message: `${count} crossLinks (max ${CROSSLINKS_THRESHOLD}) — reduz visibilidade de rede ao Google`,
      });
    }
  }
  return alerts;
}

function auditMegaMenu(): Alert[] {
  const alerts: Alert[] = [];
  if (!fs.existsSync(SRC_COMPONENTS)) return alerts;

  const patterns = [/mega[-_\s]?menu/i, /megaMenu/];
  const candidates = walk(SRC_COMPONENTS).filter((f) => /\.(tsx|ts|jsx|js)$/.test(f));

  for (const file of candidates) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = patterns.some((p) => p.test(content));
    if (!matches) continue;

    const siteRefs = countSiteReferences(content);
    if (siteRefs > MEGA_MENU_THRESHOLD) {
      alerts.push({
        severity: 'error',
        rule: 'mega-menu-excess',
        message: `${path.relative(process.cwd(), file)}: mega-menu menciona ${siteRefs} sites (max ${MEGA_MENU_THRESHOLD})`,
      });
    }
  }
  return alerts;
}

function auditFooter(totalSites: number): Alert[] {
  const alerts: Alert[] = [];
  const footerPath = path.join(SRC_COMPONENTS, 'ui', 'Footer.tsx');
  if (!fs.existsSync(footerPath)) return alerts;

  const content = fs.readFileSync(footerPath, 'utf-8');
  const siteRefs = countSiteReferences(content);

  if (siteRefs >= totalSites) {
    alerts.push({
      severity: 'error',
      rule: 'footer-all-sites',
      message: `Footer.tsx referencia ${siteRefs}/${totalSites} sites — footprint de rede exposto`,
    });
  }
  return alerts;
}

function countSiteReferences(content: string): number {
  // Heuristica: contar ocorrencias de padroes de slug (a01, b01-..., c01-..., etc).
  const slugPattern = /\b[a-f]\d{2}(?:-[a-z0-9-]+)?\b/g;
  const matches = content.match(slugPattern);
  if (!matches) return 0;
  return new Set(matches).size;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function renderReport(alerts: Alert[], sitesCount: number): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`# Auditoria de Footprint de Rede — ${today}`);
  lines.push('');
  lines.push(`**Sites analisados:** ${sitesCount}`);
  lines.push(`**Alertas:** ${alerts.length}`);
  lines.push('');

  if (alerts.length === 0) {
    lines.push('Estado: LIMPO — nenhum padrao de footprint detectado.');
    return lines.join('\n');
  }

  lines.push('| Severidade | Regra | Site | Mensagem |');
  lines.push('|-----------|-------|------|----------|');
  for (const a of alerts) {
    lines.push(`| ${a.severity} | ${a.rule} | ${a.site ?? '-'} | ${a.message} |`);
  }
  lines.push('');
  lines.push('## Como corrigir');
  lines.push('- `cross-links-excess`: reduzir `crossLinks[]` para <= 3 em `sites/<slug>/config.json`.');
  lines.push('- `mega-menu-excess`: remover mega-menu ou limitar a <=5 sites visiveis.');
  lines.push('- `footer-all-sites`: remover listagem de todos os sites do Footer.');
  return lines.join('\n');
}

function main(): void {
  const sites = loadSites();

  const alerts: Alert[] = [
    ...auditCrossLinks(sites),
    ...auditMegaMenu(),
    ...auditFooter(sites.length),
  ];

  const report = renderReport(alerts, sites.length);

  if (!fs.existsSync(OUTPUT_ROOT)) fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.join(OUTPUT_ROOT, `audit-footprint-${today}.md`);
  fs.writeFileSync(outPath, report, 'utf-8');

  console.log('━'.repeat(60));
  console.log('AUDITORIA DE FOOTPRINT DE REDE');
  console.log('━'.repeat(60));
  console.log(`Sites analisados: ${sites.length}`);
  console.log(`Alertas:          ${alerts.length}`);
  console.log(`Relatorio:        ${path.relative(process.cwd(), outPath)}`);

  if (alerts.length > 0) {
    console.log('');
    for (const a of alerts) {
      const icon = a.severity === 'error' ? '❌' : '⚠️ ';
      const scope = a.site ? ` [${a.site}]` : '';
      console.log(`${icon} ${a.rule}${scope}: ${a.message}`);
    }
    console.log('');
    console.log('Auditoria FALHOU. Corrija os alertas acima.');
    process.exit(1);
  }

  console.log('');
  console.log('Auditoria OK — nenhum footprint detectado.');
  process.exit(0);
}

main();
