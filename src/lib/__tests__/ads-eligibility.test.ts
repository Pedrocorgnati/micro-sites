/**
 * ADS-26 — Unit tests para isRouteEligibleForAds + canShowAds.
 * Cobre matriz DEC-04 + INV-ADS-07 (Cat A force-block).
 */
import { describe, it, expect } from 'vitest';
import { isRouteEligibleForAds, canShowAds } from '@/lib/ads-eligibility';
import type { SiteConfigInput } from '@/schemas/config';

const baseConfig = (overrides: Partial<SiteConfigInput> = {}): SiteConfigInput => ({
  slug: 'c01-site-institucional-pme' as never,
  name: 'Test Site',
  category: 'C',
  accentColor: '#2563EB',
  wave: 1,
  funnelStage: 'consideration',
  template: 'landing',
  hasBlog: true,
  schema: ['Organization'],
  seo: { title: 'T', description: 'D', keywords: ['k'] },
  cta: {
    primaryLabel: 'CTA',
    formEndpoint: 'https://api.staticforms.xyz/submit',
    whatsappNumber: '5511987654321',
    whatsappMessage: 'oi',
  },
  contactEmail: 'real@example.org',
  ...overrides,
}) as unknown as SiteConfigInput;

describe('isRouteEligibleForAds — rotas allowed por default', () => {
  for (const route of ['/', '/blog', '/faq', '/blog/algum-slug', '/blog/algum-slug/']) {
    it(`${route} → allowed`, () => {
      expect(isRouteEligibleForAds(route, baseConfig())).toBe('allowed');
    });
  }
});

describe('isRouteEligibleForAds — rotas hard-blocked', () => {
  for (const route of ['/obrigado', '/lista-de-espera', '/resultado', '/404']) {
    it(`${route} → blocked`, () => {
      expect(isRouteEligibleForAds(route, baseConfig())).toBe('blocked');
    });
  }

  it('rotas nao listadas → blocked (default no-ad)', () => {
    expect(isRouteEligibleForAds('/qualquer-coisa', baseConfig())).toBe('blocked');
  });
});

describe('isRouteEligibleForAds — rotas conditional opt-in', () => {
  it('default = blocked', () => {
    expect(isRouteEligibleForAds('/contato', baseConfig())).toBe('blocked');
    expect(isRouteEligibleForAds('/diagnostico', baseConfig())).toBe('blocked');
  });

  it('com routesAllowed = conditional', () => {
    const cfg = baseConfig({
      adsense: { enabled: true, slots: {}, routesAllowed: ['contato', 'diagnostico'] },
    });
    expect(isRouteEligibleForAds('/contato', cfg)).toBe('conditional');
    expect(isRouteEligibleForAds('/diagnostico', cfg)).toBe('conditional');
  });

  it('opt-in nao afeta rota nao listada', () => {
    const cfg = baseConfig({
      adsense: { enabled: true, slots: {}, routesAllowed: ['contato'] },
    });
    expect(isRouteEligibleForAds('/diagnostico', cfg)).toBe('blocked');
  });
});

describe('isRouteEligibleForAds — Categoria A (saude) force-block (INV-ADS-07)', () => {
  it('/diagnostico em Cat A = blocked mesmo com opt-in', () => {
    const cfg = baseConfig({
      category: 'A',
      adsense: { enabled: true, slots: {}, routesAllowed: ['diagnostico'] },
    });
    expect(isRouteEligibleForAds('/diagnostico', cfg)).toBe('blocked');
  });

  it('/resultado em Cat A = blocked', () => {
    const cfg = baseConfig({ category: 'A' });
    expect(isRouteEligibleForAds('/resultado', cfg)).toBe('blocked');
  });

  it('/blog em Cat A = allowed (so /diagnostico+/resultado sao force-blocked)', () => {
    const cfg = baseConfig({ category: 'A' });
    expect(isRouteEligibleForAds('/blog', cfg)).toBe('allowed');
  });
});

describe('canShowAds', () => {
  it('allowed → true', () => {
    expect(canShowAds('/', baseConfig())).toBe(true);
  });
  it('blocked → false', () => {
    expect(canShowAds('/obrigado', baseConfig())).toBe(false);
  });
  it('conditional sem opt-in → false', () => {
    expect(canShowAds('/contato', baseConfig())).toBe(false);
  });
  it('conditional com opt-in → true', () => {
    const cfg = baseConfig({
      adsense: { enabled: true, slots: {}, routesAllowed: ['contato'] },
    });
    expect(canShowAds('/contato', cfg)).toBe(true);
  });
});
