import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — TASK-8 ressalva (CL-386 wa.me fallback E2E).
 *
 * Uso esperado:
 *   1. Build de um site:    SITE_SLUG=a01-... bash scripts/build-site.sh
 *   2. Servir dist/:        npx http-server dist/${SITE_SLUG} -p 4173 -s
 *   3. Rodar testes:        E2E_BASE_URL=http://localhost:4173 npm run e2e
 *
 * Ou usar webServer (descomente o bloco) se houver script de preview unificado.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // TASK-17 ST002 / CL-311 — paralelismo na suite de matriz (E2E_MATRIX=1)
  workers: process.env.E2E_MATRIX ? 6 : process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Descomente para auto-iniciar preview estatico (requer 'http-server' instalado):
  // webServer: {
  //   command: `npx http-server dist/${process.env.SITE_SLUG ?? 'a01-ia-para-pequenos-negocios'} -p 4173 -s -c-1`,
  //   url: baseURL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 60_000,
  // },
});
