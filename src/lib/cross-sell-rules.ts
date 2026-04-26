// src/lib/cross-sell-rules.ts
// Fonte: TASK-5 intake-review (CL-114)
// Mapa categoria -> slugs recomendados em /obrigado.
// Ordem = prioridade de exibicao.

import type { SiteCategory } from '@/types';

export const CROSS_SELL_RULES: Record<SiteCategory, string[]> = {
  A: ['a02', 'a03', 'd03'],
  B: ['b02-site-antigo-lento', 'd01-calculadora-custo-site', 'c01-site-institucional-pme'],
  C: ['c02-landing-page-conversao', 'c01-site-institucional-pme', 'd03-diagnostico-maturidade-digital'],
  D: ['d02-calculadora-custo-app', 'd03-diagnostico-maturidade-digital', 'a01'],
  E: ['e02-automacao-whatsapp', 'd04-calculadora-roi-automacao', 'c06-automacao-atendimento'],
  F: ['f02-blog-marketing-digital', 'c01-site-institucional-pme', 'd05-checklist-presenca-digital'],
};

export function getCrossSellSlugs(
  category: SiteCategory,
  currentSlug: string,
  limit = 3,
): string[] {
  const recs = CROSS_SELL_RULES[category] ?? [];
  return recs.filter((slug) => slug !== currentSlug).slice(0, limit);
}
