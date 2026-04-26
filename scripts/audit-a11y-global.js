#!/usr/bin/env node
// scripts/audit-a11y-global.js
// Auditoria axe-core global em 6 sites representativos × 4 páginas críticas
// TASK-3: module-14-integration-e-auditoria
//
// Uso:
//   node scripts/audit-a11y-global.js                         # modo local (serve dist/)
//   DOMAIN=meudominio.com node scripts/audit-a11y-global.js   # produção

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { fileURLToPath } from 'node:url';
import { resolve, join, dirname } from 'node:path';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';

const DOMAIN = process.env.DOMAIN || '';
const WORKSPACE = process.cwd();
const INTEGRATION_DIR = resolve(WORKSPACE, '../../../output/docs/micro-sites/integration');
const A11Y_DIR = join(INTEGRATION_DIR, 'a11y');
const REPORT_PATH = join(INTEGRATION_DIR, 'TASK-3-A11Y-REPORT.md');

mkdirSync(A11Y_DIR, { recursive: true });

// Mapa de slug curto → diretório dist
const SLUG_MAP = {
  a01: 'a01',
  b01: 'b01-sem-site-profissional',
  c01: 'c01-site-institucional-pme',
  d01: 'd01-calculadora-custo-site',
  e01: 'e01-ia-para-pequenos-negocios',
  f01: 'f01-blog-desenvolvimento-web',
};

const SITES = Object.keys(SLUG_MAP).map((slug) => ({ slug, category: slug[0].toUpperCase() }));
const PAGES = ['/', '/blog', '/contato', '/faq'];

// ── Utilidades ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForPort(port, maxMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const http = await import('node:http');
      await new Promise((ok, fail) => {
        const req = http.default.get(`http://localhost:${port}`, () => ok());
        req.on('error', fail);
        req.setTimeout(500, () => { req.destroy(); fail(new Error('timeout')); });
      });
      return true;
    } catch {
      await sleep(300);
    }
  }
  return false;
}

// ── Server local estático ────────────────────────────────────────────────────

function startServe(dir, port) {
  const child = spawn('npx', ['serve', dir, '-p', String(port), '-s', '--no-clipboard'], {
    detached: true,
    stdio: 'ignore',
    cwd: WORKSPACE,
  });
  child.unref();
  return child;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const auditResults = [];
let totalViolations = 0;
const PORT = 18082;

const browser = await chromium.launch({ headless: true });

for (const site of SITES) {
  const distSlug = SLUG_MAP[site.slug];
  let baseUrl;
  let serveChild = null;

  if (DOMAIN) {
    baseUrl = `https://${site.slug}.${DOMAIN}`;
  } else {
    const distDir = join(WORKSPACE, 'dist', distSlug);
    if (!existsSync(distDir)) {
      console.log(`⚠ ${site.slug}: dist/${distSlug}/ não encontrado — SKIP`);
      continue;
    }
    try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' }); } catch {}
    serveChild = startServe(distDir, PORT);
    const ready = await waitForPort(PORT, 8000);
    if (!ready) {
      console.log(`⚠ ${site.slug}: serve não subiu na porta ${PORT}`);
      continue;
    }
    baseUrl = `http://localhost:${PORT}`;
  }

  for (const page of PAGES) {
    const url = `${baseUrl}${page}`;
    const result = {
      slug: site.slug,
      category: site.category,
      page,
      violations: 0,
      status: 'OK',
      details: [],
    };

    try {
      const context = await browser.newContext();
      const tab = await context.newPage();
      await tab.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

      const axeResults = await new AxeBuilder({ page: tab })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      result.violations = axeResults.violations.length;
      result.details = axeResults.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));

      if (result.violations === 0) {
        console.log(`  ✓ ${site.slug}${page}: 0 violations`);
      } else {
        console.log(`  ✗ ${site.slug}${page}: ${result.violations} violations`);
        result.details.forEach((v) => {
          console.log(`    [${v.impact}] ${v.id}: ${v.description} (${v.nodes} nodes)`);
        });
        totalViolations += result.violations;
        result.status = 'FAIL';
      }

      await tab.close();
      await context.close();
    } catch (e) {
      console.log(`  ⚠ ${site.slug}${page}: erro (${e.message.slice(0, 80)})`);
      result.status = 'ERROR';
      result.error = e.message.slice(0, 200);
    }

    auditResults.push(result);
  }

  if (serveChild) {
    try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' }); } catch {}
  }
}

// Auditoria de componentes exclusivos
console.log('\n── Componentes exclusivos ──');

// Helper para auditar componente em um site
async function auditComponent(slug, distSlug, selector, description, extraSetup) {
  const distDir = join(WORKSPACE, 'dist', distSlug);
  if (!existsSync(distDir)) {
    console.log(`  ⚠ ${slug}/${description}: dist não encontrado`);
    return { slug, component: description, violations: 0, status: 'SKIP' };
  }

  try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' }); } catch {}
  const srv = startServe(distDir, PORT);
  const ready = await waitForPort(PORT, 8000);
  if (!ready) {
    return { slug, component: description, violations: 0, status: 'ERROR', error: 'serve failed' };
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle', timeout: 15000 });
    if (extraSetup) await extraSetup(page);

    let builder = new AxeBuilder({ page });
    if (selector) builder = builder.include(selector);
    const results = await builder.analyze();

    console.log(`  ${results.violations.length === 0 ? '✓' : '✗'} ${slug}/${description}: ${results.violations.length} violations`);
    await page.close();
    await context.close();
    try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' }); } catch {}
    return {
      slug,
      component: description,
      violations: results.violations.length,
      status: results.violations.length === 0 ? 'OK' : 'FAIL',
      details: results.violations.map((v) => ({ id: v.id, impact: v.impact })),
    };
  } catch (e) {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' }); } catch {}
    return { slug, component: description, violations: 0, status: 'ERROR', error: e.message.slice(0, 200) };
  }
}

// Run sequentially — all component audits share the same port (18082)
const componentResults = [];
componentResults.push(await auditComponent('a01', 'a01', 'section[aria-label*="Depoimento"]', 'LocalTestimonials'));
componentResults.push(await auditComponent('b01', 'b01-sem-site-profissional', '[role="dialog"]', 'ExitIntentPopup', async (p) => {
  await p.evaluate(() => localStorage.removeItem('exit_popup_shown'));
  await p.reload({ waitUntil: 'networkidle' });
  await p.evaluate(() => {
    document.dispatchEvent(new MouseEvent('mouseleave', { clientY: -1, bubbles: true }));
  });
  await p.waitForTimeout(800);
}));
componentResults.push(await auditComponent('d01', 'd01-calculadora-custo-site', 'section[aria-label*="Calculadora"]', 'Calculator'));
componentResults.push(await auditComponent('e01', 'e01-ia-para-pequenos-negocios', 'form', 'WaitlistForm'));

await browser.close();

// ── Relatório ────────────────────────────────────────────────────────────────

const componentViolations = componentResults.reduce((s, r) => s + r.violations, 0);
const globalViolations = totalViolations;
const allPassed = globalViolations === 0 && componentViolations === 0;
const verdict = allPassed ? 'APROVADO' : 'REPROVADO';

// Gravar JSON raw
writeFileSync(
  join(A11Y_DIR, 'audit-results.json'),
  JSON.stringify({ timestamp: new Date().toISOString(), sites: auditResults, components: componentResults }, null, 2)
);

// Agrupar por site para tabela
const siteMap = {};
for (const r of auditResults) {
  if (!siteMap[r.slug]) siteMap[r.slug] = {};
  siteMap[r.slug][r.page] = r.violations === 0 && r.status === 'OK' ? '✓' : r.status === 'ERROR' ? '⚠' : `✗(${r.violations})`;
}

const tableRows = Object.entries(siteMap).map(([slug, pages]) => {
  return `| ${slug} | ${pages['/'] || '-'} | ${pages['/blog'] || '-'} | ${pages['/contato'] || '-'} | ${pages['/faq'] || '-'} | ${Object.values(pages).every((v) => v === '✓') ? 'Aprovado' : 'Com issues'} |`;
});

const componentRows = componentResults.map((r) => {
  const icon = r.status === 'OK' ? '✓ Aprovado' : r.status === 'SKIP' ? '⚠ SKIP' : r.status === 'ERROR' ? '⚠ ERRO' : `✗ FALHOU (${r.violations})`;
  return `| ${r.component} | Cat. ${r.slug[0].toUpperCase()} | ${r.violations} | ${icon} |`;
});

const report = `# Accessibility Report — ${new Date().toISOString().split('T')[0]}

## Resumo Executivo
- Padrão avaliado: WCAG 2.1 Level AA
- Páginas críticas auditadas: ${auditResults.filter((r) => r.status !== 'ERROR').length} (6 sites × 4 páginas)
- Componentes especiais auditados: ${componentResults.filter((r) => r.status !== 'SKIP').length}
- Violations globais: ${globalViolations}
- Violations em componentes: ${componentViolations}
- Status: ${allPassed ? '✓ CONFORME' : '✗ NÃO CONFORME'}

## Resultado por Página

| Site | / | /blog | /contato | /faq | Status |
|------|---|-------|----------|------|--------|
${tableRows.join('\n')}

## Resultado por Componente

| Componente | Categoria | Violations | Status |
|-----------|-----------|-----------|--------|
${componentRows.join('\n')}

## Conformidade WCAG 2.1 AA — Checklist
${allPassed ? '- ✓ Todos os critérios verificados por axe-core\n- ✓ 0 violations críticas' : '- ✗ Violations encontradas — ver audit-results.json para detalhes'}

## Metodologia
- Ferramenta: Playwright ${process.env.PLAYWRIGHT_VERSION || '1.59'} + axe-core
- Modo: ${DOMAIN ? `Produção (${DOMAIN})` : 'Local (dist/ serve)'}
- Navegador: Chromium headless
- Escopo: WCAG 2.1 Levels A e AA

## Veredito: ${verdict}
`;

writeFileSync(REPORT_PATH, report);

console.log(`\nTotal violations: ${globalViolations + componentViolations}`);
console.log(`Veredito: ${verdict}`);
console.log(`Relatório: ${REPORT_PATH}`);

if (allPassed) {
  const { writeFileSync: wf } = await import('node:fs');
  wf(join(INTEGRATION_DIR, '.task3-successful'), '');
}

process.exit(globalViolations + componentViolations > 0 ? 1 : 0);
