'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface GA4LoaderProps {
  gaId: string;
}

export function GA4Loader({ gaId }: GA4LoaderProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Verificar consentimento inicial
    try {
      const stored = localStorage.getItem('cookie_consent');
      if (stored === 'accepted') setActive(true);
    } catch {
      // localStorage indisponível
    }

    // Ouvir mudanças em tempo real
    const handleConsent = (e: CustomEvent<string>) => {
      setActive(e.detail === 'accepted');
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
