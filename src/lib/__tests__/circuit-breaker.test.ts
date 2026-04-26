/**
 * Tests do circuit breaker (CL-496).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordFailure,
  recordSuccess,
  shouldSkipRequest,
  getBreakerState,
  __internal,
} from '../circuit-breaker';

beforeEach(() => {
  // Reset localStorage simulado
  const store = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-25T12:00:00Z'));
});

describe('circuit-breaker', () => {
  it('comeca closed (nao skipa requests)', () => {
    expect(shouldSkipRequest('test')).toBe(false);
    expect(getBreakerState('test').status).toBe('closed');
  });

  it('abre apos 3 falhas consecutivas em 5min', () => {
    recordFailure('test');
    recordFailure('test');
    expect(shouldSkipRequest('test')).toBe(false);
    recordFailure('test');
    expect(shouldSkipRequest('test')).toBe(true);
    expect(getBreakerState('test').status).toBe('open');
  });

  it('reseta contador apos janela de 5min', () => {
    recordFailure('test');
    recordFailure('test');
    // Avanca 6min — proxima falha deve resetar contador
    vi.advanceTimersByTime(6 * 60 * 1000);
    recordFailure('test');
    // 1 falha apos reset, ainda nao abriu
    expect(shouldSkipRequest('test')).toBe(false);
  });

  it('transita para half-open apos cooldown de 60s', () => {
    recordFailure('test');
    recordFailure('test');
    recordFailure('test');
    expect(getBreakerState('test').status).toBe('open');
    vi.advanceTimersByTime(__internal.COOLDOWN_MS + 1000);
    expect(getBreakerState('test').status).toBe('half-open');
    expect(shouldSkipRequest('test')).toBe(false); // permite tentativa
  });

  it('recordSuccess reseta breaker', () => {
    recordFailure('test');
    recordFailure('test');
    recordFailure('test');
    expect(shouldSkipRequest('test')).toBe(true);
    recordSuccess('test');
    expect(shouldSkipRequest('test')).toBe(false);
    expect(getBreakerState('test').status).toBe('closed');
  });
});
