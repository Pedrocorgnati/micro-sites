/**
 * ADS-02 — Helper Google AdSense.
 *
 * SoT (Single Source of Truth) — INV-ADS-05:
 *  - clientId   → process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID (env global, 1 conta)
 *  - testMode   → derivado de process.env.NEXT_PUBLIC_APP_ENV ('production' → false; outro → true)
 *  - enabled    → config.adsense.enabled (per-site, default true)
 *  - slots      → config.adsense.slots.{header|inArticle|sidebar|footer} (per-site)
 *
 * Decisão DEC-03 (Codex thread 019dd498). Ver scheduled-updates/micro-sites/ADSENSE-INVARIANTS.md.
 */

import type { SiteConfigInput } from '@/schemas/config';

export type AdSlotName = 'header' | 'inArticle' | 'sidebar' | 'footer';
export type AdFormat = 'auto' | 'fluid' | 'rectangle';

export interface AdsenseRuntime {
  clientId: string;
  testMode: boolean;
  enabled: boolean;
}

export interface ResolvedAdSlot {
  clientId: string;
  slotId: string;
  testMode: boolean;
  format: AdFormat;
  slotName: AdSlotName;
}

const CLIENT_ID_RE = /^ca-pub-\d{16}$/;

/**
 * Resolve runtime global do AdSense a partir das envs.
 * Retorna `{ enabled: false }` se clientId ausente ou malformado — segurança.
 */
export function resolveAdsenseRuntime(): AdsenseRuntime {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? '';
  if (!CLIENT_ID_RE.test(clientId)) {
    return { clientId: '', testMode: true, enabled: false };
  }
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';
  return {
    clientId,
    testMode: appEnv !== 'production',
    enabled: true,
  };
}

/**
 * Resolve um ad slot específico para um site. Retorna null se:
 *  - runtime não habilitado (env ausente/inválida)
 *  - config.adsense ausente ou enabled=false
 *  - slotId não configurado para esse slotName
 */
export function getAdSlot(
  config: SiteConfigInput,
  slotName: AdSlotName,
  format: AdFormat = 'auto',
): ResolvedAdSlot | null {
  const runtime = resolveAdsenseRuntime();
  if (!runtime.enabled) return null;

  const ads = config.adsense;
  if (!ads || !ads.enabled) return null;

  const slotId = ads.slots?.[slotName];
  if (!slotId) return null;

  return {
    clientId: runtime.clientId,
    slotId,
    testMode: runtime.testMode,
    format,
    slotName,
  };
}
