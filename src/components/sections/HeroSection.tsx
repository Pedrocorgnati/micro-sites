'use client';

import Link from 'next/link';
import Image from 'next/image';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface HeroImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaLabel?: string;
  ctaHref?: string;
  whatsappNumber: string;
  whatsappMessage: string;
  image?: HeroImage;
}

export function HeroSection({
  headline,
  subheadline,
  ctaLabel = 'Solicitar Orçamento',
  ctaHref = '/contato',
  whatsappNumber,
  whatsappMessage,
  image,
}: HeroSectionProps) {
  const waUrl = buildWhatsAppUrl(whatsappNumber, whatsappMessage);

  const ctaBlock = (
    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
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
  );

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
        {image ? (
          // Layout 2 colunas quando imagem presente
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1
                className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
              >
                {headline}
              </h1>
              <p
                className="text-lg md:text-xl mb-8 leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {subheadline}
              </p>
              {/* Mobile: imagem acima do CTA */}
              <div className="block md:hidden mb-8 rounded-xl overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width ?? 600}
                  height={image.height ?? 400}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              {ctaBlock}
            </div>
            {/* Desktop: imagem à direita */}
            <div className="hidden md:flex flex-1 justify-end">
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width ?? 600}
                height={image.height ?? 400}
                className="rounded-xl object-cover max-w-full h-auto"
                loading="eager"
              />
            </div>
          </div>
        ) : (
          // Layout original (sem imagem) — centrado
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
        )}
      </div>
    </section>
  );
}
