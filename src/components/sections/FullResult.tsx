'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SiteConfig, CalculatorInput } from '@/types';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface ResultData {
  inputs: CalculatorInput[];
  answers: Record<string, string>;
  total: number;
  email?: string;
}

interface ResultItem {
  label: string;
  value: string;
  points: number;
}

interface FullResultProps {
  config: SiteConfig;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function FullResult({ config }: FullResultProps) {
  const [data, setData] = useState<ResultData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('calc-full-result');
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch {
      // JSON inválido — tratar como empty
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!data) {
    // Empty state
    return (
      <section
        data-testid="full-result-empty"
        aria-label="Resultado não encontrado"
        className="py-24 text-center px-4"
      >
        <p className="text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Resultado não encontrado.
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Por favor, refaça o cálculo.
        </p>
        <a
          data-testid="full-result-empty-retry-link"
          href="/#calculator"
          className="text-sm underline font-medium"
          style={{ color: 'var(--color-accent)' }}
        >
          Fazer o cálculo novamente
        </a>
      </section>
    );
  }

  // Montar itens do resultado
  const items: ResultItem[] = data.inputs.map((input) => {
    const answer = data.answers[input.id];
    const option = input.options?.find((o) => o.value === answer);
    return {
      label: input.label,
      value: option?.label ?? answer ?? '—',
      points: (option?.points ?? 0) * (input.weight ?? 1),
    };
  }).filter((item) => item.value !== '—');

  const waMessage = `${config.cta.whatsappMessage} Calculei: resultado aproximado de ${formatCurrency(data.total)}.`;
  const waUrl = buildWhatsAppUrl(config.cta.whatsappNumber, waMessage);

  function handleWhatsApp() {
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'whatsapp_click', {
        trigger: 'full_result_cta',
        site_slug: config.slug,
      });
    }
  }

  return (
    <section
      data-testid="full-result-section"
      aria-label="Resultado completo"
      className="py-16"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="max-w-[600px] mx-auto px-4">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2 text-center"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          Seu resultado completo
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Estimativa personalizada com base nas suas respostas
        </p>

        {/* Total destaque */}
        <div
          className="text-center mb-6 p-6 rounded-xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, white)', border: '1px solid', borderColor: 'var(--color-accent)' }}
        >
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Estimativa total
          </p>
          <p className="text-4xl font-extrabold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}>
            {formatCurrency(data.total)}
          </p>
        </div>

        {/* Breakdown */}
        {items.length > 0 && (
          <div
            className="rounded-xl border divide-y mb-8 overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.label}
                  <br />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {item.value}
                  </span>
                </span>
                {item.points > 0 && (
                  <span className="text-sm font-semibold shrink-0 ml-4" style={{ color: 'var(--color-text-primary)' }}>
                    {formatCurrency(item.points)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <a
            data-testid="full-result-whatsapp-button"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-sm text-white min-h-[52px] transition-all hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            Falar com especialista pelo WhatsApp
          </a>
          <Link
            data-testid="full-result-contact-link"
            href="/contato"
            className="flex-1 inline-flex items-center justify-center px-6 py-4 rounded-lg font-semibold text-sm border-2 min-h-[52px] transition-all hover:opacity-90"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            Solicitar orçamento formal
          </Link>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Esta estimativa é orientativa e pode variar conforme escopo detalhado. Fale conosco para uma proposta personalizada.
        </p>
      </div>
    </section>
  );
}
