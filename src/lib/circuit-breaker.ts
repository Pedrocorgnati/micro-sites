/**
 * src/lib/circuit-breaker.ts (CL-496)
 *
 * Circuit breaker local (browser localStorage) por scope.
 *
 * Estados:
 *   - closed:   normal, requisicoes passam
 *   - open:     bloqueia requisicoes, fallback imediato
 *   - half-open: apos COOLDOWN_MS, permite UMA tentativa
 *
 * Politica:
 *   - 3 falhas consecutivas em 5min -> open
 *   - cooldown: 60s -> transita para half-open na proxima leitura
 *   - sucesso em half-open -> reset para closed
 *   - falha em half-open -> volta para open com novo cooldown
 *
 * Persistencia: localStorage chave `cb:{scope}` com {failures, lastFailure, openedAt}.
 * SSR-safe: noop quando window nao existe.
 */

const FAILURES_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 5 * 60 * 1000; // 5 min
const COOLDOWN_MS = 60 * 1000; // 60s

interface BreakerState {
  failures: number;
  lastFailure: number; // epoch ms
  openedAt: number | null;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function key(scope: string): string {
  return `cb:${scope}`;
}

function load(scope: string): BreakerState {
  if (!isBrowser()) return { failures: 0, lastFailure: 0, openedAt: null };
  try {
    const raw = window.localStorage.getItem(key(scope));
    if (!raw) return { failures: 0, lastFailure: 0, openedAt: null };
    const parsed = JSON.parse(raw) as Partial<BreakerState>;
    return {
      failures: typeof parsed.failures === 'number' ? parsed.failures : 0,
      lastFailure: typeof parsed.lastFailure === 'number' ? parsed.lastFailure : 0,
      openedAt: typeof parsed.openedAt === 'number' ? parsed.openedAt : null,
    };
  } catch {
    return { failures: 0, lastFailure: 0, openedAt: null };
  }
}

function save(scope: string, state: BreakerState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key(scope), JSON.stringify(state));
  } catch {
    // localStorage quota or disabled — silent
  }
}

function reset(scope: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key(scope));
  } catch {
    // silent
  }
}

export function recordFailure(scope: string): void {
  const now = Date.now();
  const state = load(scope);
  // Janela de 5min: se ultima falha foi ha mais de FAILURE_WINDOW_MS, reseta contador
  const failuresInWindow = now - state.lastFailure > FAILURE_WINDOW_MS ? 1 : state.failures + 1;
  const next: BreakerState = {
    failures: failuresInWindow,
    lastFailure: now,
    openedAt: failuresInWindow >= FAILURES_THRESHOLD ? now : state.openedAt,
  };
  save(scope, next);
}

export function recordSuccess(scope: string): void {
  reset(scope);
}

export function shouldSkipRequest(scope: string): boolean {
  const state = load(scope);
  if (state.openedAt === null) return false;
  const elapsed = Date.now() - state.openedAt;
  // Half-open: cooldown expirado -> permite tentativa, nao skipa
  if (elapsed >= COOLDOWN_MS) return false;
  return true;
}

/** Helper opcional para diagnostico */
export function getBreakerState(scope: string): BreakerState & { status: 'closed' | 'open' | 'half-open' } {
  const state = load(scope);
  let status: 'closed' | 'open' | 'half-open' = 'closed';
  if (state.openedAt !== null) {
    const elapsed = Date.now() - state.openedAt;
    status = elapsed >= COOLDOWN_MS ? 'half-open' : 'open';
  }
  return { ...state, status };
}

/** Util para testes */
export const __internal = { FAILURES_THRESHOLD, FAILURE_WINDOW_MS, COOLDOWN_MS, reset };
