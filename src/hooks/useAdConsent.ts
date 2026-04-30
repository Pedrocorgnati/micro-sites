/**
 * ADS-11 — Hook reativo ao consent de Publicidade.
 *
 * Lê estado inicial via readConsent() e atualiza em resposta ao evento global
 * `cookie_consent` (disparado pelo CookieConsent.tsx).
 *
 * Uso:
 *   const advertising = useAdConsent();
 *   if (!advertising) return null;
 */
'use client';

import { useEffect, useState } from 'react';
import { readConsent, type ConsentState } from '@/lib/cookie-consent';

export function useAdConsent(): boolean {
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    const initial = readConsent();
    if (initial?.advertising === true) setAdvertising(true);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState | string>).detail;
      if (detail && typeof detail === 'object' && 'advertising' in detail) {
        setAdvertising(detail.advertising === true);
        return;
      }
      // Retrocompat: strings antigas tratam como denied (forca reabrir banner).
      setAdvertising(false);
    };

    window.addEventListener('cookie_consent', handler);
    return () => window.removeEventListener('cookie_consent', handler);
  }, []);

  return advertising;
}
