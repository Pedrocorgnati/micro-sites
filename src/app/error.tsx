'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// RESOLVED: Error boundary de nível de rota ausente (G001 — /skill:resolve-gaps)
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorPage]', error);
    }
  }, [error]);

  return (
    <main
      role="alert"
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-24 text-center"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <p
        className="text-7xl font-extrabold mb-4"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
        aria-hidden="true"
      >
        :(
      </p>

      <h1
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
      >
        Algo deu errado
      </h1>

      <p className="text-base mb-8 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Ocorreu um erro inesperado. Tente novamente ou volte ao início.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm transition-all duration-150 active:scale-95"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
          }}
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm border-2 transition-all duration-150 active:scale-95"
          style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          Voltar ao Início
        </Link>
      </div>
    </main>
  );
}
