import Image from 'next/image';
import type { Stat, Testimonial } from '@/types';

interface TrustLogo {
  src: string;
  alt: string;
  href?: string;
}

interface TrustSectionProps {
  headline?: string;
  stats?: Stat[];
  testimonials?: Testimonial[];
  logos?: TrustLogo[];
}

export function TrustSection({
  headline = 'Resultados que falam por si',
  stats,
  testimonials,
  logos,
}: TrustSectionProps) {
  const hasStats = stats && stats.length > 0;
  const hasTestimonials = testimonials && testimonials.length > 0;
  const hasLogos = logos && logos.length > 0;

  return (
    <section
      data-testid="trust-section"
      aria-label="Prova social"
      className="py-16"
      style={{ backgroundColor: 'var(--color-muted)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          {headline}
        </h2>

        {/* Stats */}
        {hasStats && (
          <div data-testid="trust-stats" className="flex flex-wrap justify-center gap-8 mb-12">
            {stats.map((stat, i) => (
              <div key={i} data-testid={`trust-stat-${i + 1}`} className="flex flex-col items-center gap-1 text-center">
                <span
                  className="text-4xl font-extrabold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
                >
                  {stat.value}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Testimonials */}
        {hasTestimonials ? (
          <div data-testid="trust-testimonials" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <figure
                key={i}
                data-testid={`trust-testimonial-${i + 1}`}
                className="flex flex-col gap-4 p-6 rounded-xl border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <blockquote>
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    "{t.quote}"
                  </p>
                </blockquote>
                <figcaption className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  — {t.name}
                  {t.role && (
                    <span className="font-normal ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {t.role}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          !hasStats && (
            <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>
              Depoimentos em breve.
            </p>
          )
        )}

        {/* Logos de parceiros/clientes */}
        {hasLogos && (
          <div
            data-testid="trust-logos"
            className="mt-12 pt-8 border-t flex flex-wrap items-center justify-center gap-6"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {logos.map((logo, i) => {
              const img = (
                <Image
                  key={i}
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain transition-all duration-200"
                  style={{ filter: 'grayscale(100%)', opacity: 0.6 }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(0%)';
                    (e.currentTarget as HTMLImageElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(100%)';
                    (e.currentTarget as HTMLImageElement).style.opacity = '0.6';
                  }}
                />
              );
              return logo.href ? (
                <a
                  key={i}
                  href={logo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`trust-logo-${i + 1}`}
                >
                  {img}
                </a>
              ) : (
                <span key={i} data-testid={`trust-logo-${i + 1}`}>
                  {img}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
