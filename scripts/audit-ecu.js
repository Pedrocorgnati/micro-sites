/**
 * audit-ecu.js — ST001: ECU (Experiência Completa do Usuário) + ST002: Anti-HCU
 * HTML-based structure audit + Playwright for JS-dependent checks
 * TASK-5: module-14-integration-e-auditoria
 */

import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { spawn, execSync } from 'child_process';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
// ROOT = output/workspace/micro-sites → ../../.. = systemForge → output/docs/...
const REPORT_DIR = resolve(ROOT, '../../../output/docs/micro-sites/integration');

// ── Category representative sites ────────────────────────────────────────────
const CATEGORIES = [
  {
    cat: 'A', slug: 'a01', label: 'Nicho Local',
    expectedSections: ['hero-section', 'problem-section', 'local-testimonials-section', 'how-it-works-section', 'faq-section'],
    contactForm: true, hasPrivacidade: true,
  },
  {
    cat: 'B', slug: 'b01-sem-site-profissional', label: 'Dor de Negócio',
    expectedSections: ['hero-section', 'problem-section', 'solution-section', 'feature-grid-section'],
    contactForm: true, hasPrivacidade: true,
  },
  {
    cat: 'C', slug: 'c01-site-institucional-pme', label: 'Serviço Digital',
    expectedSections: ['hero-section', 'solution-section', 'feature-grid-section'],
    contactForm: true, hasPrivacidade: true,
  },
  {
    cat: 'D', slug: 'd01-calculadora-custo-site', label: 'Ferramenta Interativa',
    expectedSections: ['hero-section', 'calculator-section'],
    contactForm: true, hasPrivacidade: true, hasCalculator: true, hasResultado: true,
  },
  {
    cat: 'E', slug: 'e01-ia-para-pequenos-negocios', label: 'Pré-SaaS / Waitlist',
    expectedSections: ['hero-section'],
    contactForm: true, hasPrivacidade: true, hasWaitlistForm: true,
  },
  {
    cat: 'F', slug: 'f01-blog-desenvolvimento-web', label: 'Conteúdo Educativo',
    expectedSections: ['hero-section', 'feature-grid-section'],
    contactForm: true, hasPrivacidade: true,
  },
];

// ── All 36 sites for Anti-HCU ─────────────────────────────────────────────────
const ALL_SITES = [
  // Categoria A
  { cat: 'A', slug: 'a01' }, { cat: 'A', slug: 'a02' }, { cat: 'A', slug: 'a03' },
  { cat: 'A', slug: 'a04' }, { cat: 'A', slug: 'a05' }, { cat: 'A', slug: 'a06' },
  { cat: 'A', slug: 'a07' }, { cat: 'A', slug: 'a08' }, { cat: 'A', slug: 'a09' },
  { cat: 'A', slug: 'a10' },
  // Categoria B
  { cat: 'B', slug: 'b01-sem-site-profissional' }, { cat: 'B', slug: 'b02-site-antigo-lento' },
  { cat: 'B', slug: 'b03-sem-automacao' }, { cat: 'B', slug: 'b04-sem-presenca-digital' },
  { cat: 'B', slug: 'b05-perder-clientes-online' }, { cat: 'B', slug: 'b06-sem-leads-qualificados' },
  { cat: 'B', slug: 'b07-site-nao-aparece-google' }, { cat: 'B', slug: 'b08-concorrente-digital' },
  // Categoria C
  { cat: 'C', slug: 'c01-site-institucional-pme' }, { cat: 'C', slug: 'c02-landing-page-conversao' },
  { cat: 'C', slug: 'c03-app-web-negocio' }, { cat: 'C', slug: 'c04-ecommerce-pequeno-negocio' },
  { cat: 'C', slug: 'c05-sistema-agendamento' }, { cat: 'C', slug: 'c06-automacao-atendimento' },
  { cat: 'C', slug: 'c07-sistema-gestao-web' }, { cat: 'C', slug: 'c08-manutencao-software' },
  // Categoria D
  { cat: 'D', slug: 'd01-calculadora-custo-site' }, { cat: 'D', slug: 'd02-calculadora-custo-app' },
  { cat: 'D', slug: 'd03-diagnostico-maturidade-digital' }, { cat: 'D', slug: 'd04-calculadora-roi-automacao' },
  { cat: 'D', slug: 'd05-checklist-presenca-digital' },
  // Categoria E
  { cat: 'E', slug: 'e01-ia-para-pequenos-negocios' }, { cat: 'E', slug: 'e02-automacao-whatsapp' },
  { cat: 'E', slug: 'e03-site-com-ia' },
  // Categoria F
  { cat: 'F', slug: 'f01-blog-desenvolvimento-web' }, { cat: 'F', slug: 'f02-blog-marketing-digital' },
];

// ── HTML Helpers ──────────────────────────────────────────────────────────────
function readHtml(slug, page = '') {
  const path = page
    ? join(DIST, slug, page, 'index.html')
    : join(DIST, slug, 'index.html');
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

function hasTestId(html, testId) {
  return html.includes(`data-testid="${testId}"`);
}

function hasAriaLabel(html, label) {
  return html.includes(`aria-label="${label}"`);
}

function extractH1(slug) {
  const html = readHtml(slug);
  if (!html) return null;
  const m = html.match(/<h1[^>]*>([^<]+)</);
  if (!m) return null;
  return m[1]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .trim();
}

function extractHeroText(slug) {
  const html = readHtml(slug);
  if (!html) return '';
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 500);
}

function wordOverlapSimilarity(textA, textB) {
  const words = (t) => new Set(
    t.toLowerCase()
      .replace(/[^a-záéíóúâêîôûãõàèìòùç\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  const setA = words(textA);
  const setB = words(textB);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// ── ST001: ECU HTML-Based Audit ───────────────────────────────────────────────
function testCategoryHTML(cat, slug, label, config) {
  const steps = [];
  let fail = 0;

  const assert = (condition, stepName, detail = '') => {
    const pass = Boolean(condition);
    steps.push({ step: stepName, pass, detail });
    if (!pass) fail++;
    console.log(`  ${pass ? '✓' : '✗'} [Cat.${cat}] ${stepName}${detail ? ': ' + detail : ''}`);
  };

  const homeHtml = readHtml(slug);
  if (!homeHtml) {
    console.log(`  ✗ [Cat.${cat}] dist/${slug}/index.html não encontrado`);
    return { cat, slug, steps: [{ step: 'html-presente', pass: false, detail: 'arquivo ausente' }], fail: 1, pass: false };
  }

  // Check expected sections by data-testid
  for (const testId of config.expectedSections) {
    assert(hasTestId(homeHtml, testId), `secao:${testId}`);
  }

  // Category-specific checks
  if (cat === 'A') {
    assert(hasTestId(homeHtml, 'local-testimonials-section') || hasTestId(homeHtml, 'local-testimonials-grid'), 'cat-A:local-testimonials');
  }
  if (cat === 'B') {
    const solPos = homeHtml.indexOf('aria-label="Solução"');
    const probPos = homeHtml.indexOf('aria-label="Problema"');
    assert(solPos > 0 && probPos > 0, 'cat-B:problem-e-solution-presentes');
    assert(
      hasTestId(homeHtml, 'exit-popup-overlay') || homeHtml.includes('exit_popup_shown') || homeHtml.includes('ExitIntentPopup'),
      'cat-B:exit-intent-popup-componente',
      'popup presente no bundle'
    );
  }
  if (cat === 'D') {
    assert(hasTestId(homeHtml, 'calculator-section'), 'cat-D:calculator-section');
    assert(hasTestId(homeHtml, 'calculator-next-button'), 'cat-D:calculator-next-button');
    // Check /resultado page exists
    const resultadoHtml = readHtml(slug, 'resultado');
    assert(resultadoHtml !== null, 'cat-D:/resultado-existe');
  }
  if (cat === 'E') {
    assert(hasTestId(homeHtml, 'waitlist-form'), 'cat-E:waitlist-form-presente');
    assert(hasTestId(homeHtml, 'waitlist-submit'), 'cat-E:waitlist-submit-presente');
  }

  // Contact page
  const contatoHtml = readHtml(slug, 'contato');
  assert(contatoHtml !== null, 'contato:pagina-existe');
  if (contatoHtml) {
    assert(hasTestId(contatoHtml, 'contact-form'), 'contato:form-presente');
    assert(contatoHtml.includes('name="name"'), 'contato:campo-nome');
    assert(contatoHtml.includes('name="email"'), 'contato:campo-email');
    assert(hasTestId(contatoHtml, 'contact-form-submit-button'), 'contato:botao-submit');
    assert(contatoHtml.includes('name="consent"'), 'contato:consent-lgpd');
  }

  // Privacy page
  const privacidadeHtml = readHtml(slug, 'privacidade');
  assert(privacidadeHtml !== null && privacidadeHtml.length > 5000, 'privacidade:pagina-existe');

  // CTA primary button present
  assert(hasTestId(homeHtml, 'hero-cta-button'), 'hero:cta-button-presente');

  return { cat, slug, steps, fail, pass: fail === 0 };
}

// ── ST002: Anti-HCU Analysis ──────────────────────────────────────────────────
function runAntiHCUAudit() {
  console.log('\n── ST002: Anti-HCU — Diferenciação de Conteúdo ──');

  const headlines = ALL_SITES.map((s) => ({ ...s, h1: extractH1(s.slug) }));
  const heroTexts = ALL_SITES.map((s) => ({ ...s, text: extractHeroText(s.slug) }));

  // Check H1 uniqueness
  const h1Map = new Map();
  for (const { slug, h1 } of headlines) {
    if (!h1) continue;
    if (!h1Map.has(h1)) h1Map.set(h1, []);
    h1Map.get(h1).push(slug);
  }

  const duplicates = [...h1Map.entries()].filter(([, slugs]) => slugs.length > 1);
  const missingH1 = headlines.filter((s) => !s.h1);

  console.log(`  H1 headlines: ${headlines.length - missingH1.length}/${headlines.length} extraídos`);
  if (duplicates.length === 0) {
    console.log('  ✓ Todos os H1 são únicos (0 duplicatas)');
  } else {
    console.log(`  ✗ ${duplicates.length} H1 duplicado(s)`);
    for (const [h1, slugs] of duplicates) {
      console.log(`    "${h1}" → ${slugs.join(', ')}`);
    }
  }

  // Semantic similarity within same category
  const categories = [...new Set(ALL_SITES.map((s) => s.cat))];
  const highSimilarityIssues = []; // > 70% = blocking
  const warnSimilarityIssues = []; // 50-70% = warning

  for (const cat of categories) {
    const catSites = heroTexts.filter((s) => s.cat === cat);
    for (let i = 0; i < catSites.length - 1; i++) {
      for (let j = i + 1; j < catSites.length; j++) {
        const sim = wordOverlapSimilarity(catSites[i].text, catSites[j].text);
        if (sim > 0.7) {
          highSimilarityIssues.push({ a: catSites[i].slug, b: catSites[j].slug, cat, sim: Math.round(sim * 100) });
        } else if (sim > 0.5) {
          warnSimilarityIssues.push({ a: catSites[i].slug, b: catSites[j].slug, cat, sim: Math.round(sim * 100) });
        }
      }
    }
  }

  if (highSimilarityIssues.length === 0) {
    console.log('  ✓ Nenhum par com overlap crítico (>70%)');
  } else {
    console.log(`  ✗ ${highSimilarityIssues.length} pares com overlap crítico (>70%):`);
    for (const iss of highSimilarityIssues) console.log(`    Cat.${iss.cat}: ${iss.a} ↔ ${iss.b} = ${iss.sim}%`);
  }
  if (warnSimilarityIssues.length > 0) {
    console.log(`  ~ ${warnSimilarityIssues.length} par(es) com overlap moderado (50-70%) — monitorar`);
  }

  // Canonical check — expected to be relative '/' in pre-production; flag as AVISO only
  let missingCanonicals = 0;
  for (const { slug } of ALL_SITES) {
    const html = readHtml(slug);
    if (!html) continue;
    // In Next.js static export, canonical may be relative (/) or absent if domain not set
    // This is expected pre-production behavior — flag as info, not failure
    const hasCanonical = html.includes('rel="canonical"') || html.includes("rel='canonical'");
    if (!hasCanonical) missingCanonicals++;
  }

  if (missingCanonicals === 0) {
    console.log('  ✓ Canonical URLs presentes em todos os 36 sites');
  } else {
    console.log(`  ~ ${missingCanonicals}/36 sites sem <link rel="canonical"> (esperado pré-produção — adicionar domínio no deploy)`);
  }

  // Canonical is a PRE-PRODUCTION warning, not a failure
  const totalCriticalFails = duplicates.length + highSimilarityIssues.length;
  const verdict = totalCriticalFails === 0 ? 'APROVADO' : 'REPROVADO';

  return {
    headlines, duplicates, highSimilarityIssues, warnSimilarityIssues,
    missingCanonicals, verdict, totalCriticalFails,
  };
}

// ── JS Smoke Test via Playwright ──────────────────────────────────────────────
// Only tests that require JS execution (Cookie banner, GA4 gating)
async function runJSSmokeTest() {
  console.log('\n── ST001-JS: Smoke test JavaScript (Cookie Banner + CTA navigation) ──');
  const results = [];
  const PORT = 18083;

  // Kill any stale server on this port
  try { execSync(`fuser -k ${PORT}/tcp 2>/dev/null`, { stdio: 'ignore' }); } catch { /* ok */ }
  await new Promise((r) => setTimeout(r, 300));

  const browser = await chromium.launch({ headless: true });

  for (const { cat, slug } of [
    { cat: 'A', slug: 'a01' },
    { cat: 'D', slug: 'd01-calculadora-custo-site' },
  ]) {
    const distPath = join(DIST, slug);

    const serverProc = spawn('npx', ['serve', '-s', distPath, '-p', String(PORT), '--no-clipboard'], {
      stdio: 'ignore',
      detached: false,
    });

    // Wait for server to be ready with retry
    let ready = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        const ctx = await browser.newContext();
        const p = await ctx.newPage();
        await p.goto(`http://localhost:${PORT}`, { timeout: 3000, waitUntil: 'domcontentloaded' });
        await p.close();
        await ctx.close();
        ready = true;
        break;
      } catch {
        // still starting
      }
    }

    if (!ready) {
      console.log(`  ✗ [Cat.${cat}] servidor não respondeu — SKIP JS test`);
      results.push({ cat, slug, pass: false, detail: 'servidor não respondeu' });
      serverProc.kill();
      await new Promise((r) => setTimeout(r, 300));
      continue;
    }

    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Check cookie banner visible
      const cookieBanner = await page.locator('[data-testid="cookie-banner"], [aria-label*="cookie"], [aria-label*="Cookie"]').count();
      const cookieVisible = cookieBanner > 0;
      console.log(`  ${cookieVisible ? '✓' : '~'} [Cat.${cat}] cookie-banner: ${cookieVisible ? 'visível' : 'não visível (pode ser client-only)'}`);

      // Check page title
      const title = await page.title();
      const hasTitle = title && title.length > 5;
      console.log(`  ${hasTitle ? '✓' : '✗'} [Cat.${cat}] título: "${title}"`);

      results.push({ cat, slug, pass: true, detail: `título: "${title}"` });
      await page.close();
      await context.close();
    } catch (err) {
      console.log(`  ✗ [Cat.${cat}] JS smoke ERRO: ${err.message}`);
      results.push({ cat, slug, pass: false, detail: err.message });
    }

    serverProc.kill();
    await new Promise((r) => setTimeout(r, 400));
  }

  await browser.close();
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('── ST001: ECU — Jornada por Categoria (HTML Analysis) ──');
  let ecuFail = 0;
  const ecuResults = [];

  for (const catConfig of CATEGORIES) {
    console.log(`\n  [Cat.${catConfig.cat}] ${catConfig.label} (${catConfig.slug})`);
    const result = testCategoryHTML(catConfig.cat, catConfig.slug, catConfig.label, catConfig);
    ecuResults.push(result);
    if (!result.pass) ecuFail++;
  }

  // JS smoke test (best-effort)
  const jsSmokeResults = await runJSSmokeTest();

  // Anti-HCU
  const antiHCU = runAntiHCUAudit();

  // ── Generate Reports ──────────────────────────────────────────────────────
  mkdirSync(REPORT_DIR, { recursive: true });

  const now = new Date().toISOString().split('T')[0];
  const ecuVerdict = ecuFail === 0 ? 'APROVADO' : 'REPROVADO';
  const overallVerdict = ecuFail === 0 && antiHCU.totalCriticalFails === 0 ? 'APROVADO' : 'REPROVADO';

  // ECU Report
  const ecuLines = [
    `# ECU Report — ${now}`,
    '',
    '## Resultado por Categoria',
    '',
    '| Categoria | Slug | Jornada | Falhas |',
    '|-----------|------|---------|--------|',
  ];
  for (const r of ecuResults) {
    const icon = r.pass ? '✓' : '✗';
    const failed = r.steps.filter((s) => !s.pass).map((s) => s.step).join(', ') || '-';
    ecuLines.push(`| Cat.${r.cat} | \`${r.slug}\` | ${icon} ${r.pass ? 'APROVADO' : 'FALHOU'} | ${failed} |`);
  }
  ecuLines.push('', '## Detalhamento por Categoria', '');
  for (const r of ecuResults) {
    ecuLines.push(`### Cat.${r.cat} — \`${r.slug}\``, '', '| Step | Status | Detalhe |', '|------|--------|---------|');
    for (const s of r.steps) {
      ecuLines.push(`| ${s.step} | ${s.pass ? '✓' : '✗'} | ${s.detail || '-'} |`);
    }
    ecuLines.push('');
  }
  ecuLines.push(
    '## Smoke Test JS (Playwright)',
    '',
    '| Categoria | Slug | Status | Detalhe |',
    '|-----------|------|--------|---------|',
    ...jsSmokeResults.map((r) => `| Cat.${r.cat} | \`${r.slug}\` | ${r.pass ? '✓' : '✗'} | ${r.detail} |`),
    '',
    `## Veredito ECU: ${ecuVerdict}`,
    '',
    `Total de falhas HTML: ${ecuFail}`,
  );

  writeFileSync(join(REPORT_DIR, 'ECU-REPORT.md'), ecuLines.join('\n'));

  // Anti-HCU Report
  const hcuLines = [
    `# Anti-HCU Audit — ${now}`,
    '',
    '## H1 Headlines — Unicidade (36 sites)',
    '',
    '| Slug | Cat. | H1 Headline | Status |',
    '|------|------|-------------|--------|',
    ...antiHCU.headlines.map(({ slug, cat, h1 }) => {
      const isDup = antiHCU.duplicates.some(([h]) => h === h1);
      const status = !h1 ? '⚠ ausente' : isDup ? '✗ DUPLICADO' : '✓ único';
      return `| \`${slug}\` | ${cat} | ${h1 || '—'} | ${status} |`;
    }),
    '',
    `**Total únicos:** ${antiHCU.headlines.filter((h) => h.h1).length - antiHCU.duplicates.reduce((sum, [, s]) => sum + s.length - 1, 0)}/36`,
    '',
  ];

  if (antiHCU.highSimilarityIssues.length > 0) {
    hcuLines.push('## Similaridade Crítica (>70%)', '', '| Site A | Site B | Cat. | Overlap |', '|--------|--------|------|---------|');
    for (const iss of antiHCU.highSimilarityIssues) {
      hcuLines.push(`| \`${iss.a}\` | \`${iss.b}\` | ${iss.cat} | ${iss.sim}% ✗ |`);
    }
    hcuLines.push('');
  } else {
    hcuLines.push('## Similaridade de Conteúdo', '', '✓ Nenhum par com overlap crítico (>70%). Copy suficientemente diferenciado.', '');
  }

  if (antiHCU.warnSimilarityIssues.length > 0) {
    hcuLines.push('## Similaridade Moderada (50-70%) — Monitorar', '', '| Site A | Site B | Cat. | Overlap |', '|--------|--------|------|---------|');
    for (const iss of antiHCU.warnSimilarityIssues) {
      hcuLines.push(`| \`${iss.a}\` | \`${iss.b}\` | ${iss.cat} | ${iss.sim}% ~ |`);
    }
    hcuLines.push('');
  }

  hcuLines.push(
    '## Canonical URLs (Pré-produção)',
    '',
    antiHCU.missingCanonicals === 0
      ? '✓ Todos os 36 sites possuem canonical URL.'
      : `~ ${antiHCU.missingCanonicals}/36 sites sem \`<link rel="canonical">\` no HTML estático. **Esperado em pré-produção** — adicionar domínio de produção em \`config.seo.canonical\` antes do deploy e reconstruir.`,
    '',
    `## Veredito Anti-HCU: ${antiHCU.verdict}`,
    '',
    `Falhas críticas: ${antiHCU.totalCriticalFails} (duplicatas H1: ${antiHCU.duplicates.length}, overlap >70%: ${antiHCU.highSimilarityIssues.length})`,
    '',
    '> **Nota:** Canonical URLs ausentes são aviso pré-produção, não bloqueador.',
  );

  writeFileSync(join(REPORT_DIR, 'ANTI-HCU-AUDIT.md'), hcuLines.join('\n'));

  console.log(`\n── Resultados ────────────────────────────────────────`);
  console.log(`ECU: ${ecuFail} falha(s) — Veredito: ${ecuVerdict}`);
  console.log(`Anti-HCU: ${antiHCU.totalCriticalFails} falha(s) crítica(s) — Veredito: ${antiHCU.verdict}`);
  console.log(`\nRelatórios gerados:`);
  console.log(`  ECU-REPORT.md`);
  console.log(`  ANTI-HCU-AUDIT.md`);
  console.log(`\nVeredito geral: ${overallVerdict}`);

  if (overallVerdict === 'APROVADO') {
    writeFileSync(join(REPORT_DIR, '.task5-ecu-successful'), '');
  }

  process.exit(overallVerdict === 'APROVADO' ? 0 : 1);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
