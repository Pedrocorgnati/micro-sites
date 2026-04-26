import { describe, it, expect } from 'vitest';
import {
  filterValidSections,
  VALID_SECTION_IDS,
  getSectionOrder,
} from '@/lib/section-order';

/**
 * G-M4-001 (MILESTONE-4) — Wiring de `filterValidSections` no pipeline
 * de templates. Cobre US-005 cenário ERROR (seção inválida gera BUILD_050).
 */
describe('filterValidSections', () => {
  it('mantem apenas SectionId validos', () => {
    const result = filterValidSections(['hero', 'invalid-section', 'cta']);
    expect(result).toEqual(['hero', 'cta']);
  });

  it('chama onInvalid para cada id descartado', () => {
    const invalids: string[] = [];
    const result = filterValidSections(
      ['hero', 'foo', 'bar', 'cta'],
      (id) => invalids.push(id),
    );
    expect(result).toEqual(['hero', 'cta']);
    expect(invalids).toEqual(['foo', 'bar']);
  });

  it('retorna array vazio quando nao ha ids validos', () => {
    const result = filterValidSections(['foo', 'bar']);
    expect(result).toEqual([]);
  });

  it('preserva ordem dos ids de entrada', () => {
    const result = filterValidSections(['cta', 'hero', 'features']);
    expect(result).toEqual(['cta', 'hero', 'features']);
  });

  it('todos os ids retornados por getSectionOrder sao validos (guard anti-drift)', () => {
    const categories = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
    for (const cat of categories) {
      const warnings: string[] = [];
      const order = getSectionOrder(cat);
      const filtered = filterValidSections(order, (id) => warnings.push(id));
      expect(warnings, `categoria ${cat} nao deveria ter ids invalidos`).toEqual([]);
      expect(filtered).toEqual(order);
    }
  });

  it('VALID_SECTION_IDS contem exatamente os ids esperados', () => {
    expect(VALID_SECTION_IDS.size).toBe(11);
    expect(VALID_SECTION_IDS.has('hero')).toBe(true);
    expect(VALID_SECTION_IDS.has('calculator')).toBe(true);
    expect(VALID_SECTION_IDS.has('faqs')).toBe(true);
    expect(VALID_SECTION_IDS.has('invalid' as never)).toBe(false);
  });
});
