/**
 * E2E — Voltar para /contato apos navegar fora preserva o que foi digitado.
 * TASK-19 ST002 / CL-155 — sessionStorage por slug em ContactFormBase.
 *
 * Pre-requisitos: rodar com SITE_SLUG construido + http-server (vide playwright config).
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4173';

test.describe('form state preservation', () => {
  test('contato: digitar campos, navegar, voltar -> campos preservados', async ({ page }) => {
    await page.goto(`${BASE}/contato`);

    const name = page.locator('[data-testid="contact-form-name-input"]');
    const email = page.locator('input[type="email"]').first();
    const message = page.locator('textarea').first();

    await name.fill('Pedro Teste');
    await email.fill('teste@example.com');
    await message.fill('Mensagem de teste — preservar este texto.');

    // Sair para outra rota
    await page.goto(`${BASE}/privacidade`);
    await page.waitForLoadState('domcontentloaded');

    // Voltar
    await page.goto(`${BASE}/contato`);
    await page.waitForLoadState('domcontentloaded');

    // Esperar hidratacao do form (useEffect)
    await expect(name).toHaveValue('Pedro Teste', { timeout: 5_000 });
    await expect(email).toHaveValue('teste@example.com');
    await expect(message).toHaveValue('Mensagem de teste — preservar este texto.');
  });

  test('contato: state e por slug — slug diferente nao vaza', async ({ page, context }) => {
    // Sanity check: limpar storage antes
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.clear());

    await page.goto(`${BASE}/contato`);
    await page.locator('[data-testid="contact-form-name-input"]').fill('Pedro Slug A');

    // sessionStorage e por origin (mesma URL aqui), entao a chave por slug
    // garante isolacao real apenas em build per-site. Aqui validamos a chave.
    const keys = await page.evaluate(() => Object.keys(sessionStorage));
    expect(keys.some((k) => k.startsWith('contact-form-state:'))).toBe(true);
  });
});
