/**
 * ADS-08 + ADS-14 — AdSense script loader, route-aware.
 *
 * INV-ADS-08: ZERO requests a pagead2 sem consent.advertising. Por isso:
 *   - <link rel="preconnect"> e injetado em runtime, depois do consent.
 *   - <Script src="adsbygoogle.js"> idem.
 *
 * INV-ADS-06/07: rotas blocked NAO carregam o script. Cat A / saude bloqueia
 * ate antes do bundle.
 *
 * Modo de personalizacao (ADS-38, ADS-49): NPA via flag injetada antes do bundle.
 * Categoria A força NPA. Modo `off` desliga tudo.
 */
'use client';

import Script from 'next/script';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAdConsent } from '@/hooks/useAdConsent';
import {
  effectivePersonalizationMode,
  type AdsensePersonalizationMode,
} from '@/lib/adsense-personalization';
import { canShowAds } from '@/lib/ads-eligibility';
import type { SiteConfigInput } from '@/schemas/config';

interface Props {
  /** Resolvido em layout.tsx via resolveAdsenseRuntime(). Vazio se env ausente. */
  clientId: string;
  /** Config do site corrente — usado para route eligibility (canShowAds). */
  config: SiteConfigInput;
}

/** SSR-safe useLayoutEffect (no-op no server). */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Injeta <link rel=preconnect> em runtime — só executa apos gating. */
function useDeferredPreconnect(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const links: HTMLLinkElement[] = [];
    const add = (rel: 'preconnect' | 'dns-prefetch', href: string, crossOrigin?: boolean) => {
      const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
      if (existing) return;
      const l = document.createElement('link');
      l.rel = rel;
      l.href = href;
      if (crossOrigin) l.crossOrigin = 'anonymous';
      l.dataset.adsenseInjected = 'true';
      document.head.appendChild(l);
      links.push(l);
    };
    add('preconnect', 'https://pagead2.googlesyndication.com', true);
    add('dns-prefetch', 'https://googleads.g.doubleclick.net');
    add('dns-prefetch', 'https://tpc.googlesyndication.com');
    return () => {
      for (const l of links) l.remove();
    };
  }, [active]);
}

/** Verifica se config tem ao menos UM slot configurado (header/inArticle/sidebar/footer). */
function hasAnySlotConfigured(config: SiteConfigInput): boolean {
  const slots = config.adsense?.slots;
  if (!slots) return false;
  return Boolean(slots.header || slots.inArticle || slots.sidebar || slots.footer);
}

export function AdSenseLoader({ clientId, config }: Props) {
  const advertising = useAdConsent();
  const pathname = usePathname() ?? '/';
  const mode: AdsensePersonalizationMode = effectivePersonalizationMode(config.category);

  // Gate: rota tem que ser elegivel.
  const routeEligible = useMemo(
    () => canShowAds(pathname, config),
    [pathname, config],
  );

  // ADS-REV-04: nao baixar adsbygoogle.js se nenhum slot estiver configurado.
  const slotConfigured = useMemo(() => hasAnySlotConfigured(config), [config]);

  const active =
    Boolean(clientId) &&
    mode !== 'off' &&
    advertising &&
    routeEligible &&
    slotConfigured;

  useDeferredPreconnect(active);

  // ADS-REV-02: setar a flag NPA SINCRONICAMENTE no commit phase, ANTES do
  // next/script injetar a tag <script src=...adsbygoogle.js>. Isso garante
  // que a primeira request ja tenha requestNonPersonalizedAds=1.
  // useLayoutEffect roda durante commit, antes do paint e antes do
  // afterInteractive do next/script.
  useIsoLayoutEffect(() => {
    if (!active || mode !== 'npa') return;
    const w = window as unknown as {
      adsbygoogle?: object[] & { requestNonPersonalizedAds?: number };
    };
    w.adsbygoogle = w.adsbygoogle || [];
    (w.adsbygoogle as unknown as { requestNonPersonalizedAds: number }).requestNonPersonalizedAds = 1;
  }, [active, mode]);

  if (!active) return null;

  return (
    <Script
      id="adsense-loader"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
