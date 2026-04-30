/**
 * ADS-27 — Unit tests para readConsent / writeConsent com 3 categorias.
 * Usa localStorage stub manual (repo nao tem jsdom).
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Stub localStorage no global antes de importar modulos que o usam.
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
  get length() { return this.data.size; }
  key(i: number) { return Array.from(this.data.keys())[i] ?? null; }
}
const g = globalThis as unknown as { localStorage?: Storage; window?: object };
if (!g.localStorage) g.localStorage = new MemoryStorage() as unknown as Storage;
if (!g.window) g.window = {};

// eslint-disable-next-line import/first
import { readConsent, writeConsent, clearConsent } from '@/lib/cookie-consent';
// eslint-disable-next-line import/first
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy-version';

beforeEach(() => {
  globalThis.localStorage.clear();
});

describe('writeConsent', () => {
  it('persiste 3 categorias com versao atual e timestamp', () => {
    const result = writeConsent({ analytics: true, advertising: false });
    expect(result.essential).toBe(true);
    expect(result.analytics).toBe(true);
    expect(result.advertising).toBe(false);
    expect(result.version).toBe(PRIVACY_POLICY_VERSION);
    expect(result.consentedAt).toBeDefined();
  });
});

describe('readConsent', () => {
  it('retorna null sem storage', () => {
    expect(readConsent()).toBeNull();
  });

  it('round-trip com 3 categorias', () => {
    writeConsent({ analytics: true, advertising: true });
    const r = readConsent();
    expect(r).toMatchObject({
      essential: true,
      analytics: true,
      advertising: true,
    });
  });

  it('legacy "accepted" string força reabrir banner (retorna null)', () => {
    localStorage.setItem('cookie_consent', 'accepted');
    expect(readConsent()).toBeNull();
  });

  it('legacy "rejected" string força reabrir banner (retorna null)', () => {
    localStorage.setItem('cookie_consent', 'rejected');
    expect(readConsent()).toBeNull();
  });

  it('consent sem advertising (legacy v1) tratado como advertising:false', () => {
    const stale = {
      essential: true,
      analytics: true,
      version: PRIVACY_POLICY_VERSION,
      consentedAt: new Date().toISOString(),
    };
    localStorage.setItem('cookie_consent', JSON.stringify(stale));
    const r = readConsent();
    expect(r?.advertising).toBe(false);
  });

  it('consent expirado retorna null', () => {
    const expired = {
      essential: true,
      analytics: true,
      advertising: true,
      version: PRIVACY_POLICY_VERSION,
      // 13 meses atras
      consentedAt: new Date(Date.now() - 13 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem('cookie_consent', JSON.stringify(expired));
    expect(readConsent()).toBeNull();
  });

  it('consent de versao stale retorna null', () => {
    const stale = {
      essential: true,
      analytics: true,
      advertising: true,
      version: 'old-version-2025-01-01',
      consentedAt: new Date().toISOString(),
    };
    localStorage.setItem('cookie_consent', JSON.stringify(stale));
    expect(readConsent()).toBeNull();
  });
});

describe('clearConsent', () => {
  it('apaga storage', () => {
    writeConsent({ analytics: true, advertising: true });
    clearConsent();
    expect(readConsent()).toBeNull();
  });
});
