'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className={cn(
            'min-h-[300px] flex flex-col items-center justify-center gap-6 px-4',
            this.props.className,
          )}
        >
          <p
            className="text-center text-base max-w-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Algo deu errado. Por favor, recarregue a página.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-3 rounded-lg font-medium min-h-[44px] transition-colors duration-150"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
