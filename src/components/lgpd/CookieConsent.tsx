'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ConsentState = 'unknown' | 'visible' | 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie_consent';

export function CookieConsent() {
  const [state, setState] = useState<ConsentState>('unknown');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'accepted' || stored === 'rejected') {
        setState(stored);
      } else {
        setState('visible');
      }
    } catch {
      // localStorage indisponível (modo privado)
      setState('visible');
    }
  }, []);

  function handleAccept() {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      localStorage.setItem(`${STORAGE_KEY}_at`, new Date().toISOString());
    } catch {
      // silencioso
    }
    setState('accepted');
    // Disparar evento para GA4Loader
    window.dispatchEvent(new CustomEvent('cookie_consent', { detail: 'accepted' }));
  }

  function handleReject() {
    try {
      localStorage.setItem(STORAGE_KEY, 'rejected');
    } catch {
      // silencioso
    }
    setState('rejected');
    window.dispatchEvent(new CustomEvent('cookie_consent', { detail: 'rejected' }));
  }

  // Evitar hydration mismatch e estados resolvidos
  if (state !== 'visible') return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      aria-describedby="cookie-desc"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t shadow-xl bg-white',
        'p-4 sm:p-6',
      )}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p
          id="cookie-desc"
          className="flex-1 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Usamos cookies para analisar o tráfego e melhorar sua experiência. Veja nossa{' '}
          <Link
            href="/privacidade"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 min-h-[44px] rounded-lg border text-sm font-medium transition-colors duration-150 hover:bg-gray-50"
            style={{ borderColor: '#D1D5DB', color: 'var(--color-text-primary)' }}
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
            }}
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
