'use client';

import Link from 'next/link';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaLabel?: string;
  ctaHref?: string;
  whatsappNumber: string;
  whatsappMessage: string;
}

export function HeroSection({
  headline,
  subheadline,
  ctaLabel = 'Solicitar Orçamento',
  ctaHref = '/contato',
  whatsappNumber,
  whatsappMessage,
}: HeroSectionProps) {
  const waUrl = buildWhatsAppUrl(whatsappNumber, whatsappMessage);

  return (
    <section
      data-testid="hero-section"
      aria-label="Introdução"
      className="relative"
      style={{
        background: 'linear-gradient(to bottom, var(--color-surface), var(--color-muted))',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-20 md:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <h1
            className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            {headline}
          </h1>
          <p
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {subheadline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              data-testid="hero-cta-button"
              href={ctaHref}
              className="inline-flex items-center justify-center px-8 py-4 min-h-[52px] rounded-lg font-semibold text-base transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
              }}
            >
              {ctaLabel}
            </Link>
            <a
              data-testid="hero-whatsapp-button"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 min-h-[52px] rounded-lg font-semibold text-base border-2 transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
              }}
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
