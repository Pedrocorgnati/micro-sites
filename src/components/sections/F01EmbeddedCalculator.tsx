'use client';

// F01EmbeddedCalculator — CL-393
// Wrapper que importa Calculator com inputs referenciados de D01 (calculadora-custo-site).
// F01 e um blog/educativo Cat F que ganha valor com calculadora interativa embarcada.

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { CalculatorInput, SiteConfig } from '@/types';
import { trackEvent } from '@/lib/analytics';

const Calculator = dynamic(
  () => import('./Calculator').then((m) => m.Calculator),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse h-96 rounded-xl"
        style={{ backgroundColor: 'var(--color-muted)' }}
        aria-label="Carregando calculadora"
      />
    ),
  },
);

interface F01EmbeddedCalculatorProps {
  config: SiteConfig;
  /** Inputs referenciados — geralmente vem de import dinamico de D01 config. */
  referencedInputs?: CalculatorInput[];
  /** Slug fonte da calculadora. Default: d01-calculadora-custo-site. */
  sourceSlug?: string;
}

export function F01EmbeddedCalculator({
  config,
  referencedInputs = [],
  sourceSlug = 'd01-calculadora-custo-site',
}: F01EmbeddedCalculatorProps) {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (tracked) return;
    setTracked(true);
    // CL-393: GA4 event separado para calculadora embutida em F01
    trackEvent('f01_calculator_used', {
      site: config.slug,
      source_slug: sourceSlug,
    });
  }, [config.slug, sourceSlug, tracked]);

  if (referencedInputs.length === 0) {
    return null;
  }

  return (
    <section
      id="embedded-calculator"
      data-testid="f01-embedded-calculator"
      data-source-slug={sourceSlug}
      aria-label={`Calculadora referenciada de ${sourceSlug}`}
      className="py-12"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="max-w-2xl mx-auto px-4">
        <p
          className="text-xs uppercase tracking-wider text-center mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Calculadora referenciada de {sourceSlug.replace(/-/g, ' ')}
        </p>
        <h2
          className="text-2xl font-bold text-center mb-6"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          Calcule agora seu orcamento
        </h2>
      </div>

      <Calculator
        inputs={referencedInputs}
        config={{
          ...config,
          // Marcar tipo embedded para tracking sem perder contexto F01.
          // Cast intencional: slug no Calculator e usado apenas para tracking/payload;
          // nao e validado contra CategorySlug em runtime.
          slug: `${config.slug}-embedded` as unknown as typeof config.slug,
        }}
        type="calculator"
        headline="Quanto seu site deve custar?"
        subheadline="Estimativa baseada nos mesmos parametros da D01."
      />
    </section>
  );
}
