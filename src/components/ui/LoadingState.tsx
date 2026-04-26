import * as React from 'react';

export interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton';
  label?: string;
  className?: string;
  rows?: number;
}

export function LoadingState({
  variant = 'spinner',
  label = 'Carregando...',
  className = '',
  rows = 3,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={label}
        className={`animate-pulse space-y-3 ${className}`.trim()}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-[var(--color-muted)]" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={`flex items-center gap-2 ${className}`.trim()}
    >
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
      <span className="text-sm opacity-80">{label}</span>
    </div>
  );
}

export default LoadingState;
