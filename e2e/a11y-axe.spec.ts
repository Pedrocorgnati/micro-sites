import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * G-003 (MILESTONE-2) — Auditoria axe-core nas paginas-chave.
 *
 * Cobre US-015 (WCAG 2.1 AA) na camada compartilhada da Milestone 2:
 *   - Header, Footer, WhatsAppButton em "/"
 *   - ContactFormBase em "/contato"
 *   - PrivacyPolicy em "/privacidade"
 *   - FAQ schema em "/faq"
 *
 * Falha em violacoes de severidade serious ou critical.
 * Excecoes documentadas: cor de contraste pode ser ajustada por categoria
 * (CSS vars dinamicas) — checagem aplicada em build com tokens da Milestone 1.
 */

const PAGES_TO_AUDIT = ['/', '/contato', '/privacidade', '/faq'];

for (const route of PAGES_TO_AUDIT) {
  test(`a11y WCAG 2.1 AA — ${route}`, async ({ page }) => {
    await page.goto(route);

    // Aguarda hidratacao + renderizacao completa.
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );

    if (blocking.length > 0) {
      // Mensagem detalhada para debug rapido.
      const summary = blocking
        .map(
          (v) =>
            `  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} nos)\n    ${v.helpUrl}`,
        )
        .join('\n');
      throw new Error(
        `Violacoes a11y em ${route} (${blocking.length} bloqueantes):\n${summary}`,
      );
    }

    expect(blocking).toEqual([]);
  });
}
