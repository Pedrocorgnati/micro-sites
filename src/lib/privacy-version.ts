// CL-242 — versao canonica da Politica de Privacidade.
// Bumpar SEMPRE que: copy material mudar, nova base legal, nova categoria de dado.
// Bump menor (PATCH) = correcao gramatical sem mudanca de conteudo.

// ADS-04 — bump por nova finalidade (Publicidade / Google AdSense).
// LGPD Art. 8º §5º exige novo consentimento granular para nova finalidade.
export const PRIVACY_POLICY_VERSION = '2026-04-28-ads';
export const PRIVACY_POLICY_LAST_UPDATED_AT = '2026-04-28T00:00:00Z';

/** Versao semver para programs que precisam comparar versoes. */
export const PRIVACY_POLICY_SEMVER = '1.1.0';

/**
 * Indica se um consent armazenado e considerado expirado.
 * Default: 12 meses (CL-252).
 */
export function isConsentExpired(consentedAt: string | number | undefined, ttlMonths: number = 12): boolean {
  if (!consentedAt) return true;
  const ts = typeof consentedAt === 'string' ? Date.parse(consentedAt) : consentedAt;
  if (Number.isNaN(ts)) return true;
  const expireAt = ts + ttlMonths * 30 * 24 * 60 * 60 * 1000;
  return Date.now() > expireAt;
}

/** Compara se a versao do consent armazenado bate com a versao atual. */
export function isConsentVersionStale(storedVersion: string | undefined): boolean {
  if (!storedVersion) return true;
  return storedVersion !== PRIVACY_POLICY_VERSION;
}
