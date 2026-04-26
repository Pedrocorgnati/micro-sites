'use client';

import { useEffect, useState } from 'react';

/**
 * GA4Preconnect (CL-635)
 * Renderiza <link rel="preconnect"> para www.google-analytics.com
 * SOMENTE quando o consent.analytics estiver ativo. Isto evita
 * abrir conexao com GA antes do consentimento (LGPD).
 */
type StoredConsent = { essential: true; analytics: boolean };

function readConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem('cookie_consent');
    if (!raw) return null;
    if (raw === 'accepted') return { essential: true, analytics: true };
    if (raw === 'rejected') return { essential: true, analytics: false };
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed && typeof parsed === 'object' && typeof parsed.analytics === 'boolean') {
      return { essential: true, analytics: parsed.analytics };
    }
    return null;
  } catch {
    return null;
  }
}

export function GA4Preconnect() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const initial = readConsent();
    if (initial?.analytics === true) setActive(true);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StoredConsent | string>).detail;
      if (detail && typeof detail === 'object' && 'analytics' in detail) {
        setActive(detail.analytics === true);
      }
    };
    window.addEventListener('cookie-consent-changed', handler as EventListener);
    return () => window.removeEventListener('cookie-consent-changed', handler as EventListener);
  }, []);

  if (!active) return null;

  return (
    <>
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
    </>
  );
}
