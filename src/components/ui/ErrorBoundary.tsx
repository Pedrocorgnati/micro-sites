'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  /** Numero WA opcional para fallback "falar via WhatsApp" (TASK-28). */
  whatsappNumber?: string;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

// TASK-28 ST001 / CL-196 — detectar ChunkLoadError e ramificar UI/Recovery.
function isChunkLoadError(error: Error | null | undefined): boolean {
  if (!error) return false;
  return (
    error.name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(error.message) ||
    /Loading CSS chunk/i.test(error.message)
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
    // Sentry capture (depende TASK-1 — quando enabled, captureException auto)
    if (typeof window !== 'undefined') {
      const sentry = (window as unknown as { Sentry?: { captureException?: (e: unknown) => void } }).Sentry;
      sentry?.captureException?.(error);
    }
  }

  reset = () => this.setState({ hasError: false, isChunkError: false });
  reload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { isChunkError } = this.state;
      const waUrl = this.props.whatsappNumber
        ? buildWhatsAppUrl(
            this.props.whatsappNumber,
            'Ola! Tive um erro ao carregar o site (chunk load) e gostaria de ajuda.',
          )
        : null;

      return (
        <div
          role="alert"
          data-testid={isChunkError ? 'error-boundary-chunk' : 'error-boundary-generic'}
          className={cn(
            'min-h-[300px] flex flex-col items-center justify-center gap-6 px-4 py-8',
            this.props.className,
          )}
        >
          <p
            className="text-center text-base max-w-md"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {isChunkError ? (
              <>
                <strong>Conexao instavel detectada.</strong>
                <br />
                Algumas partes do site nao carregaram. Tente recarregar — ou fale conosco direto pelo WhatsApp.
              </>
            ) : (
              'Algo deu errado. Por favor, recarregue a página.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={isChunkError ? this.reload : this.reset}
              data-testid="error-boundary-reload"
              className="px-6 py-3 rounded-lg font-medium min-h-[44px] transition-colors duration-150"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
              }}
            >
              {isChunkError ? 'Recarregar' : 'Tentar novamente'}
            </button>
            {isChunkError && waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="error-boundary-wa"
                className="px-6 py-3 rounded-lg font-medium min-h-[44px] inline-flex items-center justify-center transition-colors duration-150"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Falar via WhatsApp
              </a>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
