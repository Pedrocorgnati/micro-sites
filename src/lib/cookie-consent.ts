/**
 * Cookie consent — utilitarios canonicos.
 *
 * TASK-18 ST002 (CL-252) — retencao 12m formal + helpers reutilizaveis.
 *
 * Fonte da verdade do estado: localStorage `cookie_consent` no formato
 * { essential: true, analytics: boolean, version: string, consentedAt: string }.
 *
 * Use estes helpers em vez de ler `localStorage` diretamente.
 * Componente que renderiza banner: `src/components/lgpd/CookieConsent.tsx`.
 */
import {
  PRIVACY_POLICY_VERSION,
  isConsentExpired as _isConsentExpired,
  isConsentVersionStale,
} from './privacy-version';

export const STORAGE_KEY = 'cookie_consent';
export const TIMESTAMP_KEY = 'cookie_consent_at';

/** 12 meses em ms — retencao do consent. */
export const CONSENT_RETENTION_MS = 12 * 30 * 24 * 60 * 60 * 1000;

export interface ConsentState {
  essential: true;
  analytics: boolean;
  /** ADS-03 — opt-in para cookies de publicidade (Google AdSense). LGPD Art. 8º. */
  advertising: boolean;
  version?: string;
  consentedAt?: string;
}

/** Retorna `true` se o consent foi gravado ha mais de 12 meses (CL-252). */
export function isConsentExpired(consentedAt: string | number | undefined): boolean {
  return _isConsentExpired(consentedAt, 12);
}

/** Retorna timestamp ms em que o consent expira; null se nao houver `consentedAt`. */
export function getConsentExpiry(consentedAt: string | number | undefined): number | null {
  if (!consentedAt) return null;
  const ts = typeof consentedAt === 'string' ? Date.parse(consentedAt) : consentedAt;
  if (Number.isNaN(ts)) return null;
  return ts + CONSENT_RETENTION_MS;
}

/**
 * Le e valida o consent armazenado.
 * Retorna `null` se ausente, expirado, versao stale ou parsing falhou.
 */
export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // ADS-03: legacy strings 'accepted'/'rejected' nao incluem advertising.
    // Versao stale forca reabertura do banner (ADS-06 + LGPD Art. 8º §5º).
    if (raw === 'accepted') return null;
    if (raw === 'rejected') return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.analytics !== 'boolean') {
      return null;
    }
    if (isConsentExpired(parsed.consentedAt) || isConsentVersionStale(parsed.version)) {
      return null;
    }
    return {
      essential: true,
      analytics: parsed.analytics,
      // ADS-03: advertising defaulta para false em consents sem o campo (legacy v1).
      advertising: typeof parsed.advertising === 'boolean' ? parsed.advertising : false,
      version: parsed.version,
      consentedAt: parsed.consentedAt,
    };
  } catch {
    return null;
  }
}

/** Persiste consent com `consentedAt` e `version` atuais. */
export function writeConsent(state: { analytics: boolean; advertising: boolean }): ConsentState {
  const enriched: ConsentState = {
    essential: true,
    analytics: state.analytics,
    advertising: state.advertising,
    version: PRIVACY_POLICY_VERSION,
    consentedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
      localStorage.setItem(TIMESTAMP_KEY, enriched.consentedAt!);
    } catch {
      // localStorage indisponivel
    }
  }
  return enriched;
}

/** Remove consent armazenado. Banner ira reabrir no proximo load. */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
  } catch {
    // ignore
  }
}
