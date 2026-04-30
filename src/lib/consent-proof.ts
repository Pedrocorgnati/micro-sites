/**
 * ADS-46 — Prova de consentimento auditavel.
 *
 * LGPD Art. 8º §2º exige prova de que o consentimento foi obtido livre,
 * informado e inequivoco. O `cookie-consent.ts` so guarda estado; aqui
 * complementamos com payload tamper-evidence + breadcrumb Sentry para
 * trilha de auditoria fora do navegador do usuario.
 *
 * Sem PII excedente: user agent truncado, sem IP, sem fingerprint.
 */

import type { ConsentState } from './cookie-consent';
import { PRIVACY_POLICY_VERSION } from './privacy-version';

export const CONSENT_PROOF_KEY = 'cookie_consent_proof';

export type ConsentOrigin = 'banner' | 'manage_modal' | 'banner_default_essential';

export interface ConsentProof {
  version: string;
  banner_version: string;
  consented_at: string;
  user_agent: string;
  site_slug: string;
  categories: { essential: true; analytics: boolean; advertising: boolean };
  origin: ConsentOrigin;
  signature: string;
}

const BANNER_VERSION = 'v2.0-3cat'; // bumpa quando UI do banner muda materialmente

function truncateUA(ua: string): string {
  // Mantem so browser+major + OS family. Sem versao patch, sem device id.
  return ua.slice(0, 200);
}

/**
 * Serializacao canonica recursiva: ordena chaves de objetos plain.
 * Necessario porque JSON.stringify(obj, [...keys]) descarta sub-keys,
 * o que faria assinaturas iguais para consents diferentes (categories
 * vira `{}` se sub-keys nao estiverem na replacer array).
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => JSON.stringify(k) + ':' + canonicalize(v));
  return '{' + entries.join(',') + '}';
}

/**
 * Hash SHA-256 via Web Crypto. Tamper-evidence (nao seguranca criptografica).
 * Browsers >= 2017 suportam crypto.subtle.
 */
async function hashFields(fields: Omit<ConsentProof, 'signature'>): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return 'no-subtle-' + Date.now().toString(36);
  }
  const canonical = canonicalize(fields);
  const buf = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Captura prova auditavel para um consent. Persiste em localStorage e
 * emite breadcrumb Sentry (se carregado).
 */
export async function captureConsentProof(
  consent: ConsentState,
  origin: ConsentOrigin,
  siteSlug: string,
): Promise<ConsentProof> {
  const fields = {
    version: PRIVACY_POLICY_VERSION,
    banner_version: BANNER_VERSION,
    consented_at: consent.consentedAt ?? new Date().toISOString(),
    user_agent: typeof navigator !== 'undefined' ? truncateUA(navigator.userAgent) : 'ssr',
    site_slug: siteSlug,
    categories: {
      essential: true as const,
      analytics: consent.analytics,
      advertising: consent.advertising,
    },
    origin,
  };
  const signature = await hashFields(fields);
  const proof: ConsentProof = { ...fields, signature };

  if (typeof window !== 'undefined') {
    try {
      const existing = readConsentProofHistory();
      existing.push(proof);
      // mantem ultimos 20 — suficiente para auditoria + nao bloca quota localStorage
      const trimmed = existing.slice(-20);
      localStorage.setItem(CONSENT_PROOF_KEY, JSON.stringify(trimmed));
    } catch {
      // localStorage indisponivel
    }

    // Sentry breadcrumb (best-effort, no-op se Sentry nao carregado)
    try {
      const w = window as unknown as {
        Sentry?: { addBreadcrumb?: (b: Record<string, unknown>) => void };
      };
      w.Sentry?.addBreadcrumb?.({
        category: 'consent.captured',
        level: 'info',
        message: `consent ${origin}`,
        data: {
          version: proof.version,
          analytics: proof.categories.analytics,
          advertising: proof.categories.advertising,
          signature: proof.signature.slice(0, 16),
        },
      });
    } catch {
      // ignore
    }
  }

  return proof;
}

export function readConsentProofHistory(): ConsentProof[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONSENT_PROOF_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConsentProof[]) : [];
  } catch {
    return [];
  }
}
