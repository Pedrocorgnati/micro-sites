/**
 * sites.matrix.spec — testes parametrizados para todos os 36 sites.
 *
 * Cada site cobre:
 *   - Home renderiza com hero + footer
 *   - Sem erros console (whitelist conhecida)
 *   - ContactForm presente em /contato
 *
 * Cat D adicional:
 *   - /quanto-custa renderiza calculadora
 *   - Calculadora tem state inicial
 *
 * TASK-17 ST002 — gap CL-311
 *
 * Uso:
 *   E2E_MATRIX=1 npm run e2e -- e2e/sites.matrix.spec.ts
 *
 *   Com filtro por categoria (CI shard):
 *   CATEGORY=D E2E_MATRIX=1 npm run e2e -- e2e/sites.matrix.spec.ts
 *
 *   Com filtro por slug:
 *   SLUGS=d01,a01 E2E_MATRIX=1 npm run e2e -- e2e/sites.matrix.spec.ts
 *
 * Pre-requisito: rodar `bash scripts/build-all.sh` antes (precisa de dist/{slug}/).
 */
import { test, expect, loadSlugs, categoryOf } from './helpers/site-fixtures';

if (!process.env.E2E_MATRIX) {
  test.skip(true, 'E2E_MATRIX nao ativo — pular suite de matriz pesada');
}

const ALL_SLUGS = loadSlugs();
const CATEGORY_FILTER = process.env.CATEGORY?.toUpperCase();
const SLUGS_FILTER = (process.env.SLUGS ?? '').split(',').filter(Boolean);

const slugs = ALL_SLUGS.filter((slug) => {
  if (SLUGS_FILTER.length > 0 && !SLUGS_FILTER.some((f) => slug.startsWith(f))) return false;
  if (CATEGORY_FILTER && categoryOf(slug) !== CATEGORY_FILTER) return false;
  return true;
});

if (slugs.length === 0) {
  test('sem slugs no escopo apos filtros', () => {
    expect(slugs.length).toBeGreaterThan(0);
  });
}

const CONSOLE_WHITELIST = [
  /Failed to load resource.*favicon/,
  /404.*favicon/,
  /sentry/i, // sem DSN em E2E
];

for (const slug of slugs) {
  test.describe(slug, () => {
    test('home renderiza com hero + footer + sem console errors', async ({ page, siteServer }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!CONSOLE_WHITELIST.some((re) => re.test(text))) {
            errors.push(text);
          }
        }
      });

      await page.goto(siteServer.url);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-testid="footer"]')).toBeVisible();
      expect(errors, `console errors: ${errors.join('; ')}`).toEqual([]);
    });

    test('contato renderiza form', async ({ page, siteServer }) => {
      await page.goto(`${siteServer.url}/contato`);
      // O form pode usar testid de Contact ou role=form
      const form = page.locator('form').first();
      await expect(form).toBeVisible({ timeout: 10_000 });
      // Pelo menos um input email
      await expect(form.locator('input[type="email"], input[name="email"]')).toBeVisible();
    });

    test('privacidade tem SLA visivel + link cookies', async ({ page, siteServer }) => {
      await page.goto(`${siteServer.url}/privacidade`);
      await expect(page.locator('[data-testid="lgpd-sla-table"], h2:has-text("direitos")').first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator('a[href="/cookies"], a[href*="cookies"]').first()).toBeVisible();
    });

    test('cookies route renderiza CookiesTable', async ({ page, siteServer }) => {
      await page.goto(`${siteServer.url}/cookies`);
      await expect(page.locator('[data-testid="cookies-table"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-testid="revocation-guide"]')).toBeVisible();
    });

    if (categoryOf(slug) === 'D') {
      test('Cat D /quanto-custa renderiza calculadora', async ({ page, siteServer }) => {
        await page.goto(`${siteServer.url}/quanto-custa`);
        await expect(page.locator('[data-testid="calculator"], form').first()).toBeVisible({ timeout: 10_000 });
      });
    }
  });
}
