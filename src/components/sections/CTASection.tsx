'use client';

import Link from 'next/link';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface CTASectionProps {
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  whatsappNumber: string;
  whatsappMessage: string;
}

export function CTASection({
  headline = 'Pronto para começar?',
  subheadline,
  ctaLabel = 'Solicitar Orçamento',
  ctaHref = '/contato',
  whatsappNumber,
  whatsappMessage,
}: CTASectionProps) {
  const waUrl = buildWhatsAppUrl(whatsappNumber, whatsappMessage);

  return (
    <section
      data-testid="cta-section"
      aria-label="Chamada para ação"
      className="py-20"
      style={{ backgroundColor: 'var(--color-accent)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-2xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}
          >
            {headline}
          </h2>
          {subheadline && (
            <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {subheadline}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              data-testid="cta-section-cta-button"
              href={ctaHref}
              className="inline-flex items-center justify-center px-8 py-4 min-h-[52px] rounded-lg font-semibold text-base transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#FFFFFF', color: 'var(--color-accent)' }}
            >
              {ctaLabel}
            </Link>
            <a
              data-testid="cta-section-whatsapp-button"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 min-h-[52px] rounded-lg font-semibold text-base border-2 border-white text-white transition-all duration-150 hover:opacity-90 active:scale-95"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
