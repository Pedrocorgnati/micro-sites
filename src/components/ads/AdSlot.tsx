/**
 * ADS-12 — AdSlot (Server Component) com fallback de SelfAd.
 *
 * Resolve config + eligibility no server e decide:
 *   1. Rota blocked → null (zero render).
 *   2. Modo `off` ou env ausente ou slotId nao configurado → SelfAd direto.
 *   3. Demais casos → AdBanner (que internamente fallback para SelfAd se
 *      no consent.advertising ou no-fill).
 *
 * SelfAd nao consome consent — e 1st-party, sem cookies, sem tracking.
 */

import { getAdSlot, type AdSlotName, type AdFormat } from '@/lib/adsense';
import { canShowAds } from '@/lib/ads-eligibility';
import { resolvePersonalizationMode } from '@/lib/adsense-personalization';
import type { SiteConfigInput } from '@/schemas/config';
import { AdBanner } from './AdBanner';
import { SelfAd } from './SelfAd';

interface Props {
  config: SiteConfigInput;
  pathname: string;
  slot: AdSlotName;
  format?: AdFormat;
}

export function AdSlot({ config, pathname, slot, format = 'auto' }: Props) {
  // Rota blocked = nenhum ad (nem AdSense nem self).
  if (!canShowAds(pathname, config)) return null;

  // SelfAd usa slug do site como seed para escolha estavel por site.
  const fallbackSeed = config.slug;

  // Modo `off` (config global) → so SelfAd, AdSense desligado.
  // Cat A escapa do `off` global (effective sempre `npa`); ainda assim, se
  // env nao tem clientId, cai pra SelfAd.
  if (resolvePersonalizationMode() === 'off' && config.category !== 'A') {
    return <SelfAd slot={slot} seed={fallbackSeed} />;
  }

  // Sem env de AdSense ou sem slotId configurado → SelfAd direto.
  const resolved = getAdSlot(config, slot, format);
  if (!resolved) {
    return <SelfAd slot={slot} seed={fallbackSeed} />;
  }

  // Caminho normal: AdBanner. Internamente usa SelfAd como fallback de
  // no-fill / no consent.advertising.
  return (
    <AdBanner
      clientId={resolved.clientId}
      slotId={resolved.slotId}
      testMode={resolved.testMode}
      format={resolved.format}
      slotName={resolved.slotName}
      fallbackSeed={fallbackSeed}
    />
  );
}
