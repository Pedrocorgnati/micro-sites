// src/integration/__tests__/robots.integration.test.ts
//
// Testes de integração do Route Handler Next.js `src/app/robots.ts`.
// Valida que o manifest gerado inclui rules explicitas para bots de IA
// (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) alem do default.

import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';

describe('robots.ts — multi-bot rules', () => {
  it('retorna array de rules', () => {
    const manifest = robots();
    expect(Array.isArray(manifest.rules)).toBe(true);
  });

  it('inclui rule default (*) com disallow /obrigado', () => {
    const manifest = robots();
    const rules = manifest.rules as Array<{
      userAgent: string;
      allow?: string | string[];
      disallow?: string | string[];
    }>;
    const star = rules.find((r) => r.userAgent === '*');
    expect(star).toBeDefined();
    expect(star?.disallow).toContain('/obrigado');
  });

  it('inclui rules explicitas para bots de IA', () => {
    const manifest = robots();
    const rules = manifest.rules as Array<{ userAgent: string; allow?: string | string[] }>;
    const agents = rules.map((r) => r.userAgent);
    for (const bot of ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended']) {
      expect(agents).toContain(bot);
    }
  });

  it('referencia sitemap', () => {
    const manifest = robots();
    expect(manifest.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
