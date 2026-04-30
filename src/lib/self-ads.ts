/**
 * Self-Ads — banners proprios servidos como fallback quando AdSense nao
 * carrega (sem consent, no-fill, env ausente, modo `off`).
 *
 * Nao precisam de consent.advertising — sao 1st-party, sem cookies, sem
 * tracking de terceiros. UTM source e adicionado para attribution interna.
 *
 * Tamanhos seguem ad units padrao do Google AdSense (compatibilidade visual):
 *   header / footer:  728x90 desktop  |  320x100 mobile  (leaderboard)
 *   inArticle:        336x280 desktop |  300x250 mobile  (medium/large rectangle)
 *   sidebar:          300x600 desktop only             (half page)
 */

import type { AdSlotName } from './adsense';

export type SelfAdBrand = 'corgnati' | 'forjadesistemas';

export interface SelfAdCreative {
  /** Identificador unico (analytics + cache key). */
  id: string;
  brand: SelfAdBrand;
  slot: AdSlotName;
  /** URL externa (com UTM). */
  href: string;
  /** Alt obrigatorio (a11y). */
  alt: string;
  /** Path do asset desktop relativo a /public. */
  desktop: string;
  desktopSize: { w: number; h: number };
  /** Path do asset mobile (null para sidebar — desktop only). */
  mobile: string | null;
  mobileSize: { w: number; h: number } | null;
}

const BRAND_HOMES: Record<SelfAdBrand, string> = {
  corgnati: 'https://www.corgnati.com',
  forjadesistemas: 'https://forjadesistemas.com.br',
};

function utm(brand: SelfAdBrand, slot: AdSlotName): string {
  const base = BRAND_HOMES[brand];
  const params = new URLSearchParams({
    utm_source: 'micro-sites',
    utm_medium: 'self-ad',
    utm_campaign: brand,
    utm_content: slot,
  });
  return `${base}/?${params.toString()}`;
}

/** Catalogo completo: 2 marcas × 4 slots = 8 entries.
 *  Cada entry referencia 1-2 imagens (desktop + mobile, exceto sidebar). */
export const SELF_AD_CREATIVES: SelfAdCreative[] = [
  // ── header / footer (728x90 desktop, 320x100 mobile) ───────────
  {
    id: 'corgnati-header',
    brand: 'corgnati',
    slot: 'header',
    href: utm('corgnati', 'header'),
    alt: 'Pedro Corgnati — Engenheiro de Software, automacao e sistemas sob medida',
    desktop: '/self-ads/corgnati-728x90.png',
    desktopSize: { w: 728, h: 90 },
    mobile: '/self-ads/corgnati-320x100.png',
    mobileSize: { w: 320, h: 100 },
  },
  {
    id: 'forjadesistemas-header',
    brand: 'forjadesistemas',
    slot: 'header',
    href: utm('forjadesistemas', 'header'),
    alt: 'Forja de Sistemas — sites profissionais, apps e automacoes para PMEs',
    desktop: '/self-ads/forjadesistemas-728x90.png',
    desktopSize: { w: 728, h: 90 },
    mobile: '/self-ads/forjadesistemas-320x100.png',
    mobileSize: { w: 320, h: 100 },
  },
  {
    id: 'corgnati-footer',
    brand: 'corgnati',
    slot: 'footer',
    href: utm('corgnati', 'footer'),
    alt: 'Pedro Corgnati — Engenheiro de Software, automacao e sistemas sob medida',
    desktop: '/self-ads/corgnati-728x90.png',
    desktopSize: { w: 728, h: 90 },
    mobile: '/self-ads/corgnati-320x100.png',
    mobileSize: { w: 320, h: 100 },
  },
  {
    id: 'forjadesistemas-footer',
    brand: 'forjadesistemas',
    slot: 'footer',
    href: utm('forjadesistemas', 'footer'),
    alt: 'Forja de Sistemas — sites profissionais, apps e automacoes para PMEs',
    desktop: '/self-ads/forjadesistemas-728x90.png',
    desktopSize: { w: 728, h: 90 },
    mobile: '/self-ads/forjadesistemas-320x100.png',
    mobileSize: { w: 320, h: 100 },
  },

  // ── inArticle (336x280 desktop, 300x250 mobile) ────────────────
  {
    id: 'corgnati-inArticle',
    brand: 'corgnati',
    slot: 'inArticle',
    href: utm('corgnati', 'inArticle'),
    alt: 'Pedro Corgnati — Engenheiro de Software, automacao e sistemas sob medida',
    desktop: '/self-ads/corgnati-336x280.png',
    desktopSize: { w: 336, h: 280 },
    mobile: '/self-ads/corgnati-300x250.png',
    mobileSize: { w: 300, h: 250 },
  },
  {
    id: 'forjadesistemas-inArticle',
    brand: 'forjadesistemas',
    slot: 'inArticle',
    href: utm('forjadesistemas', 'inArticle'),
    alt: 'Forja de Sistemas — sites profissionais, apps e automacoes para PMEs',
    desktop: '/self-ads/forjadesistemas-336x280.png',
    desktopSize: { w: 336, h: 280 },
    mobile: '/self-ads/forjadesistemas-300x250.png',
    mobileSize: { w: 300, h: 250 },
  },

  // ── sidebar (300x600 desktop only) ─────────────────────────────
  {
    id: 'corgnati-sidebar',
    brand: 'corgnati',
    slot: 'sidebar',
    href: utm('corgnati', 'sidebar'),
    alt: 'Pedro Corgnati — Engenheiro de Software, automacao e sistemas sob medida',
    desktop: '/self-ads/corgnati-300x600.png',
    desktopSize: { w: 300, h: 600 },
    mobile: null,
    mobileSize: null,
  },
  {
    id: 'forjadesistemas-sidebar',
    brand: 'forjadesistemas',
    slot: 'sidebar',
    href: utm('forjadesistemas', 'sidebar'),
    alt: 'Forja de Sistemas — sites profissionais, apps e automacoes para PMEs',
    desktop: '/self-ads/forjadesistemas-300x600.png',
    desktopSize: { w: 300, h: 600 },
    mobile: null,
    mobileSize: null,
  },
];

/**
 * Seleciona um creative para o slot. Estrategia: rotacao deterministica
 * baseada em hash do (slotName + dia ISO) — em SSG isso produz um banner
 * estavel por build, sem flicker entre re-renders, e alterna ao longo do
 * tempo entre as duas marcas.
 */
export function pickSelfAd(slot: AdSlotName, seed?: string): SelfAdCreative | null {
  const candidates = SELF_AD_CREATIVES.filter((c) => c.slot === slot);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;
  // Hash determinístico; seed e opcional para garantir build-stable.
  const s = seed ?? new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return candidates[h % candidates.length] ?? null;
}
