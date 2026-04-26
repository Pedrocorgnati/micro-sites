'use client';

import * as React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Nao foi possivel concluir a operacao. Tente novamente.',
  onRetry,
  retryLabel = 'Tentar novamente',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center py-8 px-4 ${className}`.trim()}
    >
      <h3 className="text-lg font-semibold text-red-600 mb-1">{title}</h3>
      <p className="text-sm opacity-80 max-w-md mb-4">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default ErrorState;
