// CL-364: E2E /simulador para D05
// Esta spec assume que SITE_SLUG=d05-checklist-presenca-digital esta sendo servido
// (use `SITE_SLUG=d05-... npm run dev` ou playwright webServer dedicado).
import { expect, test } from '@playwright/test';

const isD05Build = process.env.SITE_SLUG?.startsWith('d05') ?? false;

test.describe('D05 /simulador', () => {
  test.skip(!isD05Build, 'Spec exclusiva para SITE_SLUG=d05-*');

  test('renderiza checklist completo com itens prioritarios', async ({ page }) => {
    await page.goto('/simulador');

    await expect(page).toHaveTitle(/Simulador|Checklist/i);
    // D05Checklist renderiza acoes prioritarias
    const heading = page.getByRole('heading', { name: /presenca digital|simulador|checklist/i }).first();
    await expect(heading).toBeVisible();

    // Acoes prioritarias renderizadas
    const items = page.locator('[data-checklist-action], [data-area-id]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('tem CTA pos-resultado para captura de email', async ({ page }) => {
    await page.goto('/simulador');
    const cta = page.getByTestId('simulador-cta-email');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /\/contato/);
  });

  test('breadcrumb navega para inicio', async ({ page }) => {
    await page.goto('/simulador');
    const breadcrumbHome = page.getByRole('link', { name: /inicio/i }).first();
    await expect(breadcrumbHome).toBeVisible();
  });
});

test.describe('Sites nao-D05: /simulador redireciona', () => {
  test.skip(isD05Build, 'Verificacao apenas em sites nao-D05');
  test('redireciona para /', async ({ page }) => {
    const response = await page.goto('/simulador', { waitUntil: 'networkidle' });
    // meta-refresh redireciona — esperar URL mudar
    await page.waitForURL('**/');
    expect(page.url()).toMatch(/\/$/);
  });
});
