/**
 * ADS-27/46 — Tests para captura de prova de consentimento.
 *
 * Critico: assinatura DEVE diferenciar consents com sub-keys diferentes
 * (categories.analytics e categories.advertising). Bug original com
 * JSON.stringify replacer-array deixava `categories: {}`.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Stub localStorage + crypto.subtle (Node 19+ tem global crypto, e Web SubtleCrypto).
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
  get length() { return this.data.size; }
  key(i: number) { return Array.from(this.data.keys())[i] ?? null; }
}
const g = globalThis as unknown as {
  localStorage?: Storage;
  window?: { Sentry?: object };
  navigator?: { userAgent: string };
};
if (!g.localStorage) g.localStorage = new MemoryStorage() as unknown as Storage;
if (!g.window) g.window = {};
if (!g.navigator) g.navigator = { userAgent: 'node-test/1.0' };

// eslint-disable-next-line import/first
import { captureConsentProof, readConsentProofHistory } from '@/lib/consent-proof';
// eslint-disable-next-line import/first
import type { ConsentState } from '@/lib/cookie-consent';

beforeEach(() => {
  globalThis.localStorage.clear();
});

const stateAccept: ConsentState = {
  essential: true,
  analytics: true,
  advertising: true,
  version: 'v1',
  consentedAt: '2026-04-28T12:00:00.000Z',
};
const stateReject: ConsentState = {
  ...stateAccept,
  analytics: false,
  advertising: false,
};

describe('captureConsentProof', () => {
  it('persiste prova em localStorage', async () => {
    const proof = await captureConsentProof(stateAccept, 'banner', 'a01');
    expect(proof.signature).toBeTruthy();
    expect(proof.categories.analytics).toBe(true);
    expect(proof.categories.advertising).toBe(true);
    const history = readConsentProofHistory();
    expect(history).toHaveLength(1);
  });

  it('assinaturas diferentes para consents diferentes (canonicalize)', async () => {
    const accept = await captureConsentProof(stateAccept, 'banner', 'a01');
    localStorage.clear();
    const reject = await captureConsentProof(stateReject, 'banner', 'a01');
    expect(accept.signature).not.toEqual(reject.signature);
  });

  it('historico mantem ate 20 entradas (rolling)', async () => {
    for (let i = 0; i < 25; i++) {
      await captureConsentProof(
        { ...stateAccept, consentedAt: `2026-04-28T12:00:0${i}.000Z` },
        'banner',
        'a01',
      );
    }
    const history = readConsentProofHistory();
    expect(history.length).toBeLessThanOrEqual(20);
  });
});
