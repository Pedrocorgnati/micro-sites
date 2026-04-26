import { test, expect } from '@playwright/test';

/**
 * G-002 (MILESTONE-2) — GA4 nao carrega antes do consent.
 *
 * Prova que o gating LGPD esta operante:
 *   - Antes do click "Aceitar" no banner, NENHUM script do googletagmanager existe no DOM.
 *   - Apos o click "Aceitar", o script aparece dinamicamente.
 *
 * Pre-requisito: site servido via dist/ (ver playwright.config.ts).
 * Variavel de ambiente NEXT_PUBLIC_GA_ID precisa estar setada no build.
 */
test.describe('LGPD — gating do GA4 antes do consent', () => {
  test.beforeEach(async ({ page }) => {
    // Garante estado limpo do localStorage para que o banner apareca.
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('cookie_consent');
        window.localStorage.removeItem('cookie_consent_at');
      } catch {
        // Modo privado — ignora.
      }
    });
  });

  test('GA4 ausente do DOM antes de qualquer interacao', async ({ page }) => {
    await page.goto('/');

    const banner = page.getByTestId('cookie-consent-banner');
    await expect(banner).toBeVisible();

    const gtmScripts = await page
      .locator('script[src*="googletagmanager.com"], script[src*="google-analytics.com"]')
      .count();
    expect(gtmScripts).toBe(0);
  });

  test('GA4 carrega apos click em "Aceitar"', async ({ page }) => {
    await page.goto('/');

    const acceptButton = page.getByTestId('cookie-consent-accept-button');
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();

    // O banner sai do DOM e o GA4 e injetado via next/script.
    await expect(page.getByTestId('cookie-consent-banner')).toBeHidden();

    // GA4 pode ser injetado via next/script. Aguardar ate 5s.
    await expect
      .poll(
        async () =>
          page.locator('script[src*="googletagmanager.com"]').count(),
        { timeout: 5_000 },
      )
      .toBeGreaterThan(0);
  });

  test('GA4 permanece bloqueado apos click em "Recusar"', async ({ page }) => {
    await page.goto('/');

    const rejectButton = page.getByTestId('cookie-consent-reject-button');
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();

    await expect(page.getByTestId('cookie-consent-banner')).toBeHidden();

    // Pequena espera para garantir que o consent listener nao injetou nada.
    await page.waitForTimeout(1_000);
    const gtmScripts = await page
      .locator('script[src*="googletagmanager.com"]')
      .count();
    expect(gtmScripts).toBe(0);
  });

  test('localStorage registra estado de consentimento', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cookie-consent-accept-button').click();

    const storedState = await page.evaluate(() =>
      window.localStorage.getItem('cookie_consent'),
    );
    expect(storedState).toBeTruthy();
    const parsed = JSON.parse(storedState!);
    expect(parsed.essential).toBe(true);
    expect(parsed.analytics).toBe(true);

    const timestamp = await page.evaluate(() =>
      window.localStorage.getItem('cookie_consent_at'),
    );
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
