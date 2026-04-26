/**
 * Section order by category — source of truth for the vertical section flow
 * on `src/app/page.tsx`. Used by the page render + by ordering assertions.
 *
 * CL-173: Cat D — Calculator logo apos Hero (seccao 2).
 * CL-175: Cat B — Solution antes de Problem (reforco de prova social).
 */

export type SectionId =
  | 'hero'
  | 'calculator'
  | 'problem'
  | 'solution'
  | 'features'
  | 'localTestimonials'
  | 'howItWorks'
  | 'trust'
  | 'waitlist'
  | 'faqs'
  | 'cta';

export type Category = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const BASE: SectionId[] = [
  'hero',
  'problem',
  'solution',
  'features',
  'localTestimonials',
  'howItWorks',
  'trust',
  'waitlist',
  'faqs',
  'cta',
];

const D_ORDER: SectionId[] = [
  'hero',
  'calculator',
  'problem',
  'solution',
  'features',
  'localTestimonials',
  'howItWorks',
  'trust',
  'waitlist',
  'faqs',
  'cta',
];

const B_ORDER: SectionId[] = [
  'hero',
  'solution',
  'problem',
  'features',
  'localTestimonials',
  'howItWorks',
  'trust',
  'waitlist',
  'faqs',
  'cta',
];

export const SECTION_ORDER_BY_CATEGORY: Record<Category, SectionId[]> = {
  A: BASE,
  B: B_ORDER,
  C: BASE,
  D: D_ORDER,
  E: BASE,
  F: BASE,
};

export function getSectionOrder(category: string | undefined): SectionId[] {
  const key = (category ?? 'C').toUpperCase() as Category;
  return SECTION_ORDER_BY_CATEGORY[key] ?? BASE;
}

/**
 * Conjunto de `SectionId` válidos — usado por `filterValidSections` para guardar
 * a invariante US-005 (cenário ERROR): qualquer sessão passada para o pipeline
 * de render que não pertença a este conjunto é ignorada e gera `[BUILD_050]`.
 */
export const VALID_SECTION_IDS: ReadonlySet<SectionId> = new Set<SectionId>([
  'hero',
  'calculator',
  'problem',
  'solution',
  'features',
  'localTestimonials',
  'howItWorks',
  'trust',
  'waitlist',
  'faqs',
  'cta',
]);

/**
 * Filtra uma lista de IDs mantendo apenas `SectionId` válidos.
 * Para cada ID inválido, chama `onInvalid(id)` (se fornecido) — tipicamente
 * usado em DEV mode para emitir `console.warn('[BUILD_050] ...')`.
 *
 * Cobre US-005 cenário ERROR — BUILD_050.
 */
export function filterValidSections(
  input: readonly string[],
  onInvalid?: (id: string) => void,
): SectionId[] {
  const valid: SectionId[] = [];
  for (const id of input) {
    if (VALID_SECTION_IDS.has(id as SectionId)) {
      valid.push(id as SectionId);
    } else if (onInvalid) {
      onInvalid(id);
    }
  }
  return valid;
}

/**
 * For sites with category D: index of Calculator section (must be 1 = seccao 2).
 * For sites with category B: Solution must come before Problem.
 */
export function assertCategoryInvariants(category: Category): void {
  const order = SECTION_ORDER_BY_CATEGORY[category];
  if (category === 'D') {
    const idx = order.indexOf('calculator');
    if (idx !== 1) throw new Error(`[section-order] Cat D: calculator deve estar na seccao 2 (idx=1), got idx=${idx}`);
  }
  if (category === 'B') {
    const solIdx = order.indexOf('solution');
    const probIdx = order.indexOf('problem');
    if (!(solIdx >= 0 && probIdx >= 0 && solIdx < probIdx)) {
      throw new Error(`[section-order] Cat B: solution deve vir antes de problem`);
    }
  }
}
