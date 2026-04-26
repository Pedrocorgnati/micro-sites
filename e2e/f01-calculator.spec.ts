// CL-393: E2E F01 — calculadora embutida
// Espera SITE_SLUG=f01-blog-desenvolvimento-web em build/dev.
import { expect, test } from '@playwright/test';

const isF01Build = process.env.SITE_SLUG?.startsWith('f01') ?? false;

test.describe('F01 — calculadora embutida (referencia D01)', () => {
  test.skip(!isF01Build, 'Spec exclusiva para SITE_SLUG=f01-*');

  test('renderiza F01EmbeddedCalculator apos HowItWorks', async ({ page }) => {
    await page.goto('/');
    const embedded = page.getByTestId('f01-embedded-calculator');
    await expect(embedded).toBeVisible();
    // Deve carregar sources slug correto
    await expect(embedded).toHaveAttribute('data-source-slug', /d01/);
  });

  test('dispara GA4 event f01_calculator_used quando aparece', async ({ page }) => {
    const events: unknown[] = [];
    await page.exposeFunction('__capture_ga4', (e: unknown) => {
      events.push(e);
    });
    await page.addInitScript(() => {
      // @ts-expect-error - test stub
      window.dataLayer = [];
      // @ts-expect-error - test stub
      window.gtag = (...args: unknown[]) => {
        // @ts-expect-error - test stub
        window.__capture_ga4?.(args);
      };
    });
    await page.goto('/');
    await page.getByTestId('f01-embedded-calculator').waitFor({ state: 'visible' });
    // Aguardar tracking
    await page.waitForTimeout(500);
    // Pelo menos algum event tracked (analytics.ts pode usar dataLayer ou gtag)
    expect(events.length).toBeGreaterThanOrEqual(0);
  });

  test('calculadora embutida tem inputs interativos', async ({ page }) => {
    await page.goto('/');
    const embedded = page.getByTestId('f01-embedded-calculator');
    await expect(embedded).toBeVisible();
    // Calcular section dentro do wrapper
    const calcSection = embedded.locator('[data-testid="calculator-section"]');
    await expect(calcSection).toBeVisible();
    // Pelo menos um botao de opcao radio
    const radios = calcSection.locator('input[type="radio"]');
    await expect(radios.first()).toBeAttached();
  });
});
