/**
 * lighthouse-monthly-report — consolida outputs LHCI em markdown mensal.
 *
 * Le `.lighthouseci/` ou `docs/lighthouse/{YYYY-MM}/lighthouse-{slug}.json`
 * gerados por `scripts/lighthouse-monthly.sh` e produz tabela consolidada
 * com delta vs mes anterior.
 *
 * Saida:
 *   - output/reports/lighthouse-monthly/{YYYY-MM}.md
 *
 * TASK-16 ST001 — gaps CL-009, CL-341
 *
 * Usage:
 *   npx tsx scripts/lighthouse-monthly-report.ts [--month YYYY-MM]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const REPORTS_OUT = path.join(ROOT, 'output/reports/lighthouse-monthly');
const LH_BASE = path.join(ROOT, 'docs/lighthouse');
const LHCI = path.join(ROOT, '.lighthouseci');

const monthArg = (() => {
  const i = process.argv.indexOf('--month');
  return i >= 0 ? process.argv[i + 1] : new Date().toISOString().slice(0, 7);
})();

interface SiteScore {
  slug: string;
  performance: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
  lcp: number | null; // ms
  cls: number | null;
  inp: number | null; // ms (or fid)
}

function readScore(jsonPath: string, slug: string): SiteScore | null {
  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as {
      lhr?: { categories?: Record<string, { score?: number | null }>; audits?: Record<string, { numericValue?: number }> };
      categories?: Record<string, { score?: number | null }>;
      audits?: Record<string, { numericValue?: number }>;
    };
    const cats = raw.lhr?.categories ?? raw.categories ?? {};
    const audits = raw.lhr?.audits ?? raw.audits ?? {};
    const score = (k: string): number | null => {
      const c = cats[k];
      if (!c || c.score == null) return null;
      return Math.round(c.score * 100);
    };
    const audit = (k: string): number | null => {
      const a = audits[k];
      return a?.numericValue ?? null;
    };
    return {
      slug,
      performance: score('performance'),
      accessibility: score('accessibility'),
      seo: score('seo'),
      bestPractices: score('best-practices'),
      lcp: audit('largest-contentful-paint'),
      cls: audit('cumulative-layout-shift'),
      inp: audit('interaction-to-next-paint') ?? audit('max-potential-fid'),
    };
  } catch {
    return null;
  }
}

function loadMonth(yyyymm: string): SiteScore[] {
  const dir = path.join(LH_BASE, yyyymm);
  const out: SiteScore[] = [];
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const slug = f.replace(/^lighthouse-/, '').replace(/\.json$/, '');
      const s = readScore(path.join(dir, f), slug);
      if (s) out.push(s);
    }
  }
  // Tambem tenta .lighthouseci/ como fallback (gera relatorio do run mais recente)
  if (out.length === 0 && fs.existsSync(LHCI)) {
    for (const f of fs.readdirSync(LHCI)) {
      if (!f.endsWith('.json') || !f.startsWith('lhr-')) continue;
      const s = readScore(path.join(LHCI, f), f.replace(/\.json$/, ''));
      if (s) out.push(s);
    }
  }
  return out;
}

function fmt(n: number | null, suffix = ''): string {
  if (n == null) return '-';
  if (suffix === 'ms') return `${Math.round(n)}ms`;
  if (suffix === 'cls') return n.toFixed(3);
  return String(n);
}

function delta(curr: number | null, prev: number | null): string {
  if (curr == null || prev == null) return '-';
  const d = curr - prev;
  if (d === 0) return '=';
  const sign = d > 0 ? '+' : '';
  return `${sign}${d}`;
}

function prevMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

function main(): void {
  fs.mkdirSync(REPORTS_OUT, { recursive: true });
  const current = loadMonth(monthArg);
  const previous = loadMonth(prevMonth(monthArg));
  const prevMap = new Map(previous.map((s) => [s.slug, s]));

  if (current.length === 0) {
    console.warn(`[lh-monthly] sem dados em docs/lighthouse/${monthArg}/ ou .lighthouseci/`);
    process.exit(0);
  }

  const file = path.join(REPORTS_OUT, `${monthArg}.md`);
  const lines = [
    `# Lighthouse Monthly Report — ${monthArg}`,
    '',
    `**Sites auditados:** ${current.length}`,
    `**Comparacao com:** ${prevMonth(monthArg)} (${previous.length} sites)`,
    '',
    '## Tabela consolidada',
    '',
    '| Slug | Perf | A11y | SEO | BP | LCP | CLS | INP | dPerf |',
    '|---|---|---|---|---|---|---|---|---|',
  ];

  for (const s of current.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const prev = prevMap.get(s.slug);
    lines.push(
      `| ${s.slug} | ${fmt(s.performance)} | ${fmt(s.accessibility)} | ${fmt(s.seo)} | ${fmt(s.bestPractices)} | ${fmt(s.lcp, 'ms')} | ${fmt(s.cls, 'cls')} | ${fmt(s.inp, 'ms')} | ${delta(s.performance, prev?.performance ?? null)} |`,
    );
  }

  // Sumario
  const avg = (key: keyof SiteScore): number => {
    const vals = current.map((s) => s[key]).filter((v): v is number => typeof v === 'number');
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };
  lines.push(
    '',
    '## Sumario',
    '',
    `- Performance medio: **${avg('performance')}**`,
    `- Accessibility medio: **${avg('accessibility')}**`,
    `- SEO medio: **${avg('seo')}**`,
    `- Best Practices medio: **${avg('bestPractices')}**`,
    '',
    `## Sites abaixo do threshold (Perf <90, Cat D <85)`,
    '',
  );
  const fails = current.filter((s) => {
    if (s.performance == null) return false;
    const threshold = s.slug.startsWith('d') ? 85 : 90;
    return s.performance < threshold;
  });
  if (fails.length === 0) {
    lines.push('Nenhum site abaixo do threshold.');
  } else {
    for (const f of fails) {
      lines.push(`- ${f.slug}: Perf=${f.performance} (threshold ${f.slug.startsWith('d') ? 85 : 90})`);
    }
  }

  lines.push('', `Gerado em ${new Date().toISOString()} por scripts/lighthouse-monthly-report.ts`);

  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf-8');
  console.log(`[lh-monthly] ${file}`);
}

main();
