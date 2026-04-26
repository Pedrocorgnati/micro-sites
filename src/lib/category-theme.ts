// src/lib/category-theme.ts
// Fonte: TASK-4 intake-review (CL-322, CL-158..CL-163).
// Fonte unica da paleta por categoria conforme INTAKE.md secao "Paleta base".
// Reexporta o mapa canonico de constants.ts para manter unica fonte de verdade.

import type { SiteCategory } from '@/types';
import { CATEGORY_THEME_COLORS as CANONICAL } from './constants';

export const CATEGORY_THEME_COLORS: Record<SiteCategory, string> = CANONICAL;

export function getCategoryAccent(category: SiteCategory): string {
  return CATEGORY_THEME_COLORS[category];
}
