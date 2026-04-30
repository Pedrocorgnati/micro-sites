/**
 * ADS-38 — Modelo de personalizacao publicitaria.
 *
 * Decisao default: NPA (Non-Personalized Ads).
 * Override via env: NEXT_PUBLIC_ADSENSE_PERSONALIZATION = 'off' | 'npa' | 'personalized'
 *
 * Razao: NPA preserva LGPD compliance (sem cookies de personalizacao baseados
 * em comportamento entre sites), mantem ~70% do revenue maximo e nao exige
 * CMP certificada Google (so necessaria para EEA/UK/CH, fora do escopo Brasil).
 *
 * Categoria A (saude — INV-ADS-07) sempre forca NPA, ignorando este valor.
 */

export type AdsensePersonalizationMode = 'off' | 'npa' | 'personalized';

const DEFAULT_MODE: AdsensePersonalizationMode = 'npa';

export function resolvePersonalizationMode(): AdsensePersonalizationMode {
  const raw = (process.env.NEXT_PUBLIC_ADSENSE_PERSONALIZATION ?? '').toLowerCase();
  if (raw === 'off' || raw === 'npa' || raw === 'personalized') return raw;
  return DEFAULT_MODE;
}

/**
 * Categoria A (saude) sempre forca NPA, mesmo se modo global for personalized.
 */
export function effectivePersonalizationMode(category: string): AdsensePersonalizationMode {
  if (category === 'A') return 'npa';
  return resolvePersonalizationMode();
}

/**
 * Mapeia o modo para grants do Google Consent Mode v2.
 * Usado por GA4Loader/AdSenseLoader em sincronia com consent.advertising.
 */
export function consentGrantsForMode(
  mode: AdsensePersonalizationMode,
  advertisingAccepted: boolean,
): {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
} {
  if (!advertisingAccepted || mode === 'off') {
    return {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    };
  }
  if (mode === 'npa') {
    return {
      ad_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    };
  }
  // personalized
  return {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  };
}
