// src/lib/__tests__/calculator-validation.test.ts
// TASK-5 intake-review (CL-325) — validacao rigorosa de inputs D01-D05.
import { describe, it, expect } from 'vitest';
import { calculatorSchemas, validateCalculatorInput, currencyBRL } from '../calculator-states';

describe('calculatorSchemas', () => {
  it('d01: aprova dentro dos bounds', () => {
    const r = calculatorSchemas.d01.safeParse({ orcamentoSite: 5000, numeroPaginas: 10 });
    expect(r.success).toBe(true);
  });

  it('d01: rejeita abaixo do minimo', () => {
    const r = calculatorSchemas.d01.safeParse({ orcamentoSite: 100, numeroPaginas: 5 });
    expect(r.success).toBe(false);
  });

  it('d01: rejeita acima do maximo', () => {
    const r = calculatorSchemas.d01.safeParse({ orcamentoSite: 1_000_000, numeroPaginas: 5 });
    expect(r.success).toBe(false);
  });

  it('d01: rejeita NaN', () => {
    const r = calculatorSchemas.d01.safeParse({ orcamentoSite: Number.NaN, numeroPaginas: 5 });
    expect(r.success).toBe(false);
  });

  it('d01: rejeita Infinity', () => {
    const r = calculatorSchemas.d01.safeParse({
      orcamentoSite: Number.POSITIVE_INFINITY,
      numeroPaginas: 5,
    });
    expect(r.success).toBe(false);
  });

  it('d01: rejeita numeroPaginas nao inteiro', () => {
    const r = calculatorSchemas.d01.safeParse({ orcamentoSite: 5000, numeroPaginas: 3.5 });
    expect(r.success).toBe(false);
  });

  it('d01: rejeita string vazia (nao-number)', () => {
    const r = calculatorSchemas.d01.safeParse({ orcamentoSite: '', numeroPaginas: 5 });
    expect(r.success).toBe(false);
  });

  it('d04: rejeita negativo em custoHora', () => {
    const r = calculatorSchemas.d04.safeParse({
      horasEconomizadasMes: 20,
      custoHora: -10,
      numeroFuncionarios: 5,
    });
    expect(r.success).toBe(false);
  });
});

describe('validateCalculatorInput', () => {
  it('retorna ok:true para input valido', () => {
    const r = validateCalculatorInput('d03', { score: 55 });
    expect(r.ok).toBe(true);
  });

  it('retorna errors mapeados por path', () => {
    const r = validateCalculatorInput('d01', { orcamentoSite: 10, numeroPaginas: 1000 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.orcamentoSite).toBeTruthy();
      expect(r.errors.numeroPaginas).toBeTruthy();
    }
  });

  it('rejeita calculadora desconhecida', () => {
    const r = validateCalculatorInput('dx' as never, {});
    expect(r.ok).toBe(false);
  });
});

describe('currencyBRL', () => {
  it('formata valor em pt-BR BRL', () => {
    expect(currencyBRL.format(1234.56)).toContain('1.234,56');
  });
});
