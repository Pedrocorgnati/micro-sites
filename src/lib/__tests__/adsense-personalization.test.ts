/**
 * ADS-26 — Unit tests para resolvePersonalizationMode + effective + grants.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolvePersonalizationMode,
  effectivePersonalizationMode,
  consentGrantsForMode,
} from '@/lib/adsense-personalization';

describe('resolvePersonalizationMode', () => {
  const ORIGINAL_ENV = { ...process.env };
  beforeEach(() => { delete process.env.NEXT_PUBLIC_ADSENSE_PERSONALIZATION; });
  afterEach(() => { process.env = { ...ORIGINAL_ENV }; });

  it('default = npa', () => {
    expect(resolvePersonalizationMode()).toBe('npa');
  });
  it.each(['off', 'npa', 'personalized'] as const)('aceita %s', (m) => {
    process.env.NEXT_PUBLIC_ADSENSE_PERSONALIZATION = m;
    expect(resolvePersonalizationMode()).toBe(m);
  });
  it('valor invalido cai para default', () => {
    process.env.NEXT_PUBLIC_ADSENSE_PERSONALIZATION = 'aggressive';
    expect(resolvePersonalizationMode()).toBe('npa');
  });
});

describe('effectivePersonalizationMode (INV-ADS-07)', () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => { process.env = { ...ORIGINAL_ENV }; });

  it('Cat A força npa mesmo com env=personalized', () => {
    process.env.NEXT_PUBLIC_ADSENSE_PERSONALIZATION = 'personalized';
    expect(effectivePersonalizationMode('A')).toBe('npa');
  });
  it('Cat C respeita env=personalized', () => {
    process.env.NEXT_PUBLIC_ADSENSE_PERSONALIZATION = 'personalized';
    expect(effectivePersonalizationMode('C')).toBe('personalized');
  });
});

describe('consentGrantsForMode (Consent Mode v2)', () => {
  it('advertising=false → tudo denied independente do mode', () => {
    expect(consentGrantsForMode('personalized', false)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('mode=off → tudo denied mesmo com advertising=true', () => {
    expect(consentGrantsForMode('off', true)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('mode=npa + advertising=true → só ad_storage granted', () => {
    expect(consentGrantsForMode('npa', true)).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('mode=personalized + advertising=true → tudo granted', () => {
    expect(consentGrantsForMode('personalized', true)).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
});
