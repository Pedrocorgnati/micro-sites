/**
 * E2E — ErrorBoundary detecta ChunkLoadError e renderiza fallback recovery.
 * TASK-28 ST003 / CL-196.
 *
 * Testa duas dimensoes:
 *   1. Chunk JS bloqueado -> fallback chunk renderiza com botoes Recarregar + WhatsApp
 *   2. /resultado tem botao "Refazer calculo" linkando /quanto-custa?prefill=1
 *
 * Pre-requisito: build de um site Cat D + http-server (ou E2E_BASE_URL apontando).
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4173';

test.describe('chunk error fallback', () => {
  test('bloqueia _next/static chunks e ErrorBoundary renderiza fallback chunk', async ({ page }) => {
    // Intercepta chunks de Calculator (lazy-loaded em pages Cat D)
    await page.route('**/_next/static/chunks/**', (route) => {
      const url = route.request().url();
      // Bloqueia apenas chunks que parecam de feature dynamic-import (heuristica)
      if (/calculator|simulador/i.test(url)) {
        return route.fulfill({ status: 503, body: 'Service Unavailable' });
      }
      return route.continue();
    });

    await page.goto(`${BASE}/quanto-custa`);

    // Esperar o ErrorBoundary renderizar (timeout maior pois precisa Erro vir + ER decidir)
    const fallback = page.locator('[data-testid="error-boundary-chunk"]');
    await expect(fallback).toBeVisible({ timeout: 15_000 });

    // Validar botoes
    await expect(page.locator('[data-testid="error-boundary-reload"]')).toBeVisible();
    // WA button so existe se site tem whatsappNumber configurado — soft check
    const waBtn = page.locator('[data-testid="error-boundary-wa"]');
    if ((await waBtn.count()) > 0) {
      const href = await waBtn.getAttribute('href');
      expect(href).toMatch(/wa\.me|api\.whatsapp/);
    }
  });

  test('/resultado tem botao "Refazer calculo" linkando /quanto-custa?prefill=1', async ({ page }) => {
    await page.goto(`${BASE}/resultado`);
    const link = page.locator('[data-testid="resultado-refazer-link"]');
    await expect(link).toBeVisible({ timeout: 10_000 });
    const href = await link.getAttribute('href');
    expect(href).toContain('/quanto-custa');
    expect(href).toContain('prefill=');
  });
});
