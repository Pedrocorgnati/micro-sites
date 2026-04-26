import { formatBRL } from './format-brl';

export type CalculatorState = 'idle' | 'input' | 'computing' | 'result' | 'error';

export type CalculatorAction =
  | { type: 'START' }
  | { type: 'INPUT_CHANGE' }
  | { type: 'SUBMIT' }
  | { type: 'COMPUTE_OK' }
  | { type: 'COMPUTE_FAIL' }
  | { type: 'RESET' };

const TRANSITIONS: Record<CalculatorState, Partial<Record<CalculatorAction['type'], CalculatorState>>> = {
  idle: { START: 'input' },
  input: { INPUT_CHANGE: 'input', SUBMIT: 'computing', RESET: 'idle' },
  computing: { COMPUTE_OK: 'result', COMPUTE_FAIL: 'error' },
  result: { RESET: 'idle', START: 'input' },
  error: { RESET: 'idle', SUBMIT: 'computing' },
};

export function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  const next = TRANSITIONS[state]?.[action.type];
  return next ?? state;
}

export const INITIAL_CALCULATOR_STATE: CalculatorState = 'idle';

// ============================================================
// Numeric input validation — TASK-5 intake-review (CL-325)
// Bounds plausiveis por calculadora D01-D05. Bloqueia NaN/Infinity/negativos.
// ============================================================

import { z } from 'zod';

export type CalculatorId = 'd01' | 'd02' | 'd03' | 'd04' | 'd05';

const numberBounds = (min: number, max: number, integer = false) =>
  z
    .number({ error: 'Informe um valor numérico válido' })
    .refine((v) => Number.isFinite(v), 'Valor inválido')
    .refine((v) => (integer ? Number.isInteger(v) : true), 'Informe um número inteiro')
    .min(min, `Valor minimo: ${min}`)
    .max(max, `Valor maximo: ${max}`);

export const calculatorSchemas = {
  // D01 — Calculadora custo de site
  d01: z.object({
    orcamentoSite: numberBounds(500, 100_000),
    numeroPaginas: numberBounds(1, 50, true),
  }),
  // D02 — Calculadora custo de app
  d02: z.object({
    orcamentoApp: numberBounds(5_000, 500_000),
    numeroTelas: numberBounds(1, 100, true),
  }),
  // D03 — Diagnostico maturidade digital (score 0-100)
  d03: z.object({
    score: numberBounds(0, 100),
  }),
  // D04 — ROI automacao
  d04: z.object({
    horasEconomizadasMes: numberBounds(0, 720),
    custoHora: numberBounds(1, 10_000),
    numeroFuncionarios: numberBounds(1, 1000, true),
  }),
  // D05 — Checklist presenca digital
  d05: z.object({
    itensCompletos: numberBounds(0, 50, true),
  }),
} as const;

// TASK-24 ST001 / CL-624 — formatador legacy (mantido por compat); preferir formatBRL canonico.
export const currencyBRL = {
  format: (n: number) => formatBRL(n),
};

export function validateCalculatorInput(
  id: CalculatorId,
  input: unknown,
): { ok: true; data: unknown } | { ok: false; errors: Record<string, string> } {
  const schema = calculatorSchemas[id];
  if (!schema) return { ok: false, errors: { _form: `Calculadora desconhecida: ${id}` } };
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.join('.') || '_form';
    if (!errors[path]) errors[path] = issue.message;
  }
  return { ok: false, errors };
}

