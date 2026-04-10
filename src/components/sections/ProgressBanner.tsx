'use client';

import { useEffect, useState } from 'react';
import { TIMING } from '@/types';

interface SavedProgress {
  answers: Record<string, string>;
  step: number;
  ts: number;
}

interface ProgressBannerProps {
  slug: string;
  onRetomar: (saved: SavedProgress) => void;
  onComecarDoZero: () => void;
}

export function ProgressBanner({ slug, onRetomar, onComecarDoZero }: ProgressBannerProps) {
  const [saved, setSaved] = useState<SavedProgress | null>(null);

  useEffect(() => {
    const key = `calc_progress_${slug}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data: SavedProgress = JSON.parse(raw);
      // Verificar TTL
      if (Date.now() - data.ts > TIMING.localStorageTTLMs) {
        localStorage.removeItem(key);
        return;
      }
      setSaved(data);
    } catch {
      // JSON inválido — ignorar
    }
  }, [slug]);

  if (!saved) return null;

  return (
    <div
      data-testid="progress-banner"
      role="alert"
      aria-live="polite"
      className="my-4 p-4 rounded-xl border"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-accent)' }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
        Você tem uma calculadora em progresso.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="progress-banner-retomar-button"
          onClick={() => onRetomar(saved)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white min-h-[44px] transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Retomar
        </button>
        <button
          type="button"
          data-testid="progress-banner-comecar-do-zero-button"
          onClick={onComecarDoZero}
          className="px-4 py-2 rounded-lg text-sm font-medium border min-h-[44px] transition-colors hover:bg-gray-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Começar do zero
        </button>
      </div>
    </div>
  );
}
