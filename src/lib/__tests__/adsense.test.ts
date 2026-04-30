/**
 * ADS-26 — Unit tests para resolveAdsenseRuntime + getAdSlot.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveAdsenseRuntime, getAdSlot } from '@/lib/adsense';
import type { SiteConfigInput } from '@/schemas/config';

const baseConfig: SiteConfigInput = {
  slug: 'a01' as never,
  name: 'Test Site',
  category: 'A',
  accentColor: '#2563EB',
  wave: 1,
  funnelStage: 'consideration',
  template: 'landing',
  hasBlog: false,
  schema: ['Organization'],
  seo: { title: 'T', description: 'D', keywords: ['k'] },
  cta: {
    primaryLabel: 'CTA',
    formEndpoint: 'https://api.staticforms.xyz/submit',
    whatsappNumber: '5511987654321',
    whatsappMessage: 'oi',
  },
  contactEmail: 'real@example.org',
} as unknown as SiteConfigInput;

describe('resolveAdsenseRuntime', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_APP_ENV;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('retorna disabled quando clientId ausente', () => {
    const r = resolveAdsenseRuntime();
    expect(r.enabled).toBe(false);
    expect(r.clientId).toBe('');
    expect(r.testMode).toBe(true);
  });

  it('retorna disabled quando clientId malformado', () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'invalid';
    const r = resolveAdsenseRuntime();
    expect(r.enabled).toBe(false);
  });

  it('testMode true quando APP_ENV=staging', () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-1234567890123456';
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    const r = resolveAdsenseRuntime();
    expect(r.enabled).toBe(true);
    expect(r.testMode).toBe(true);
  });

  it('testMode false APENAS quando APP_ENV=production', () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-1234567890123456';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    const r = resolveAdsenseRuntime();
    expect(r.testMode).toBe(false);
  });

  it('testMode true quando APP_ENV ausente', () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-1234567890123456';
    const r = resolveAdsenseRuntime();
    expect(r.testMode).toBe(true);
  });
});

describe('getAdSlot', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-1234567890123456';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('retorna null se runtime disabled', () => {
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    const cfg = { ...baseConfig, adsense: { enabled: true, slots: { header: '1234567890' }, routesAllowed: [] } };
    expect(getAdSlot(cfg, 'header')).toBeNull();
  });

  it('retorna null se config.adsense ausente', () => {
    expect(getAdSlot(baseConfig, 'header')).toBeNull();
  });

  it('retorna null se config.adsense.enabled=false', () => {
    const cfg = { ...baseConfig, adsense: { enabled: false, slots: { header: '1234567890' }, routesAllowed: [] } };
    expect(getAdSlot(cfg, 'header')).toBeNull();
  });

  it('retorna null se slot ausente', () => {
    const cfg = { ...baseConfig, adsense: { enabled: true, slots: {}, routesAllowed: [] } };
    expect(getAdSlot(cfg, 'header')).toBeNull();
  });

  it('retorna slot resolvido quando tudo OK', () => {
    const cfg = { ...baseConfig, adsense: { enabled: true, slots: { header: '1234567890' }, routesAllowed: [] } };
    const slot = getAdSlot(cfg, 'header');
    expect(slot).toEqual({
      clientId: 'ca-pub-1234567890123456',
      slotId: '1234567890',
      testMode: false,
      format: 'auto',
      slotName: 'header',
    });
  });
});
