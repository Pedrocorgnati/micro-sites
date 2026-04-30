'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { readConsent as readCanonicalConsent, type ConsentState } from '@/lib/cookie-consent';
import {
  consentGrantsForMode,
  effectivePersonalizationMode,
} from '@/lib/adsense-personalization';

interface GA4LoaderProps {
  gaId: string;
  /** Categoria do site (`config.category`). Cat A força NPA. */
  category: string;
}

interface ActiveState {
  analytics: boolean;
  advertising: boolean;
}

function readActive(): ActiveState {
  const c: ConsentState | null = readCanonicalConsent();
  return {
    analytics: c?.analytics === true,
    advertising: c?.advertising === true,
  };
}

export function GA4Loader({ gaId, category }: GA4LoaderProps) {
  const [state, setState] = useState<ActiveState>({ analytics: false, advertising: false });

  useEffect(() => {
    setState(readActive());

    const handleConsent = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState | string>).detail;
      if (detail && typeof detail === 'object' && 'analytics' in detail) {
        setState({
          analytics: detail.analytics === true,
          advertising: detail.advertising === true,
        });
        return;
      }
      setState({ analytics: false, advertising: false });
    };

    window.addEventListener('cookie_consent', handleConsent);
    return () => window.removeEventListener('cookie_consent', handleConsent);
  }, []);

  // ADS-09: emite consent update reativo quando ads consent muda E o gtag ja existe.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== 'function') return;
    const mode = effectivePersonalizationMode(category);
    const grants = consentGrantsForMode(mode, state.advertising);
    w.gtag('consent', 'update', {
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ...grants,
    });
  }, [state.analytics, state.advertising, category]);

  if (!state.analytics || !gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true, send_page_view: true });
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
        `}
      </Script>
    </>
  );
}
