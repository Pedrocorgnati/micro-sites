'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SiteConfig, CalculatorInput, CalculatorType } from '@/types';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatResult } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { captureResultadoParseError } from '@/lib/sentry-helpers';

interface ResultData {
  inputs: CalculatorInput[];
  answers: Record<string, string>;
  total: number;
  email?: string;
  type?: CalculatorType;
}

interface ResultItem {
  label: string;
  value: string;
  points: number;
}

interface FullResultProps {
  config: SiteConfig;
  pdfPath?: string;
}

export function FullResult({ config, pdfPath }: FullResultProps) {
  const [data, setData] = useState<ResultData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('calc-full-result');
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch (err) {
      // JSON inválido — capturar para Sentry sem PII
      captureResultadoParseError(err, typeof window !== 'undefined' ? window.location.search : '');
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
          className="text-sm underline font-medium focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded"
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

  const calcType = data.type ?? 'calculator';
  const waMessage = `${config.cta.whatsappMessage} Calculei: resultado aproximado de ${formatResult(data.total, calcType)}.`;
  const waUrl = buildWhatsAppUrl(config.cta.whatsappNumber, waMessage);

  function handleWhatsApp() {
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'whatsapp_click', {
        trigger: 'full_result_cta',
        site_slug: config.slug,
      });
    }
  }

  function handlePdfDownload() {
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'pdf_download', {
        site_slug: config.slug,
      });
    }
    // TASK-7 / CL-013: dimensoes canonicas para segmentacao de nurture
    // (calculator_type + nurture_priority_tag).
    const calculatorType = config.slug?.match(/^d\d{2}/i)?.[0]?.toLowerCase() ?? '';
    const nurturePriorityTag = config.slug?.startsWith('d03')
      ? 'D03'
      : config.slug?.startsWith('d04')
      ? 'D04'
      : undefined;
    trackEvent('lead_magnet_downloaded', {
      site: config.slug,
      source: config.slug,
      calculator_type: calculatorType,
      nurture_priority_tag: nurturePriorityTag,
      pdfSlug: pdfPath ?? '',
    });
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
            {formatResult(data.total, calcType)}
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
                    {formatResult(item.points, calcType)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div data-print-hide className="flex flex-col sm:flex-row gap-3 mb-6">
          <a
            data-testid="full-result-whatsapp-button"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-sm text-white min-h-[52px] transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            style={{ backgroundColor: '#25D366' }}
          >
            Falar com especialista pelo WhatsApp
          </a>
          <Link
            data-testid="full-result-contact-link"
            href="/contato"
            className="flex-1 inline-flex items-center justify-center px-6 py-4 rounded-lg font-semibold text-sm border-2 min-h-[52px] transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            Solicitar orçamento formal
          </Link>
        </div>

        {pdfPath && (
          <div data-print-hide className="mb-6">
            <a
              data-testid="full-result-pdf-download"
              href={pdfPath}
              download
              onClick={handlePdfDownload}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-sm min-h-[52px] transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              Baixar relatório completo (PDF)
            </a>
          </div>
        )}

        {/* Botao Imprimir (CL-623) */}
        <div data-print-hide className="mb-6 text-center">
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm border transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-secondary)' }}
            aria-label="Imprimir resultado"
          >
            Imprimir resultado
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Esta estimativa é orientativa e pode variar conforme escopo detalhado. Fale conosco para uma proposta personalizada.
        </p>
      </div>
    </section>
  );
}
