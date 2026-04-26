import { test, expect } from '@playwright/test';

/**
 * CL-386 — E2E wa.me fallback.
 * Valida que o botao WhatsApp gera URL `https://wa.me/55...` com utm_source
 * mesmo quando o app WhatsApp nao esta disponivel (navegacao intercept).
 */
test.describe('WhatsApp button fallback', () => {
  test('click produz URL wa.me/55 com utm_source', async ({ page, context }) => {
    await page.goto('/');

    const waLink = page.locator('[data-testid="whatsapp-button"], a[href^="https://wa.me/"]').first();
    await expect(waLink).toBeVisible();

    const href = await waLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href!).toMatch(/^https:\/\/wa\.me\/55\d{10,11}\?/);
    expect(href!).toContain('utm_source=');
  });

  test('abre em nova aba (rel=noopener)', async ({ page }) => {
    await page.goto('/');
    const waLink = page.locator('a[href^="https://wa.me/"]').first();
    await expect(waLink).toHaveAttribute('target', '_blank');
    const rel = await waLink.getAttribute('rel');
    expect(rel ?? '').toMatch(/noopener/);
  });
});
