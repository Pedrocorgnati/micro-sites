'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { readConsent as readCanonicalConsent, type ConsentState } from '@/lib/cookie-consent';

interface GA4LoaderProps {
  gaId: string;
}

type StoredConsent = { essential: true; analytics: boolean };

// TASK-18 ST003 (CL-252): usa readConsent canonico que ja invalida consents
// expirados (>12m) e de versao stale.
function readConsent(): StoredConsent | null {
  const c: ConsentState | null = readCanonicalConsent();
  if (!c) return null;
  return { essential: true, analytics: c.analytics };
}

export function GA4Loader({ gaId }: GA4LoaderProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const initial = readConsent();
    if (initial?.analytics === true) setActive(true);

    const handleConsent = (e: CustomEvent<StoredConsent | string>) => {
      const detail = e.detail;
      if (detail && typeof detail === 'object' && 'analytics' in detail) {
        setActive(detail.analytics === true);
        return;
      }
      // Retrocompat com versoes antigas que enviavam 'accepted' / 'rejected'
      setActive(detail === 'accepted');
    };

    window.addEventListener('cookie_consent', handleConsent as EventListener);
    return () => window.removeEventListener('cookie_consent', handleConsent as EventListener);
  }, []);

  if (!active || !gaId) return null;

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
          gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied' });
        `}
      </Script>
    </>
  );
}
