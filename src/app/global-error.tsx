'use client';

import { useEffect } from 'react';
import { captureRootError } from '@/lib/sentry-helpers';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureRootError(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main
          role="alert"
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '1.5rem', maxWidth: 480 }}>
            Tivemos um erro inesperado nesta pagina. Voce pode tentar novamente ou voltar para o inicio.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: 8,
                background: '#1f2937',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Tentar novamente
            </button>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: 8,
                background: '#fff',
                color: '#1f2937',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Voltar ao inicio
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
