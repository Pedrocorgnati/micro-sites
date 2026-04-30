/**
 * ADS-39 — Orquestracao de revogacao de consent de Publicidade.
 *
 * Quando usuario revoga (banner ou /cookies):
 *   1. window.adsbygoogle.pauseAdRequests = 1 — para novas requests AdSense.
 *   2. gtag('consent','update',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}).
 *   3. Apaga cookies AdSense locais (best-effort — Google mantem em dominios proprios).
 *   4. Re-grava consent com advertising:false.
 *   5. Dispatch event para AdSlot/AdBanner desmontarem (via useAdConsent).
 */

import { writeConsent, readConsent } from './cookie-consent';

const ADSENSE_LOCAL_COOKIES = ['__gads', '__gpi', '__gpi_optout'];

/** Apaga cookies AdSense do dominio atual. Google mantem em .google.com / .doubleclick.net. */
function clearLocalAdsenseCookies() {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  // Tenta no host atual e dominio raiz (com . prefixo).
  const domains = [host, `.${host}`];
  // Se for subdominio, tenta o registrable domain (basico — sem PSL completo).
  const parts = host.split('.');
  if (parts.length > 2) {
    const root = parts.slice(-2).join('.');
    domains.push(root, `.${root}`);
  }
  for (const name of ADSENSE_LOCAL_COOKIES) {
    for (const domain of domains) {
      // path=/ + max-age=0 = expira imediato.
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
    }
    // Sem domain (so path) — fallback.
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

/** Pausa requests futuras do AdSense via flag global. */
function pauseAdRequests() {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { adsbygoogle?: { pauseAdRequests?: number } & object[] };
  if (w.adsbygoogle && Array.isArray(w.adsbygoogle)) {
    (w.adsbygoogle as unknown as { pauseAdRequests: number }).pauseAdRequests = 1;
  }
}

/** Atualiza Consent Mode v2 do gtag. */
function updateGtagConsentDenied() {
  if (typeof window === 'undefined') return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

/**
 * Revoga consent de Publicidade preservando Analytics atual.
 * Retorna ConsentState atualizado. Dispatcha evento `cookie_consent`.
 */
export function revokeAdvertisingConsent(): void {
  const current = readConsent();
  const next = writeConsent({
    analytics: current?.analytics ?? false,
    advertising: false,
  });

  applyAdvertisingRevocationSideEffects();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookie_consent', { detail: next }));
  }
}

/**
 * Aplica os 3 side-effects de revogacao SEM regravar o storage nem dispatchar
 * evento. Util quando o caller ja persistiu o novo estado e quer apenas
 * acionar a limpeza Google + cookies + gtag.
 */
export function applyAdvertisingRevocationSideEffects(): void {
  pauseAdRequests();
  updateGtagConsentDenied();
  clearLocalAdsenseCookies();
}
