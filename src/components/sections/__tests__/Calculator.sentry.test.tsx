import { describe, expect, it, vi } from 'vitest';
import { captureCalculatorError } from '@/lib/sentry-helpers';

vi.mock('@/lib/sentry-helpers', () => ({
  captureCalculatorError: vi.fn(),
  captureResultadoParseError: vi.fn(),
  captureRootError: vi.fn(),
  setSentryContextTags: vi.fn(),
}));

describe('Calculator Sentry instrumentation', () => {
  it('captureCalculatorError nao recebe campos de PII (email/telefone)', () => {
    const err = new Error('boom: email=foo@bar.com telefone=11999999999');
    captureCalculatorError(err, { slug: 'd01', step: 2, type: 'calculator' });
    expect(captureCalculatorError).toHaveBeenCalledTimes(1);
    const call = (captureCalculatorError as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    // ctx nao deve carregar PII
    const ctx = call[1] as { slug: string; step: number; type: string };
    expect(JSON.stringify(ctx)).not.toMatch(/@/);
    expect(JSON.stringify(ctx)).not.toMatch(/\d{11}/);
  });
});
