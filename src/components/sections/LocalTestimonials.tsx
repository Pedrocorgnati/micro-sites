import type { Testimonial } from '@/types';

interface LocalTestimonialsProps {
  headline?: string;
  testimonials?: Testimonial[];
  /**
   * CL-250: rotulo "ilustrativos" quando depoimentos sao demonstrativos
   * (sem coleta com consentimento real). Default e `illustrative` ate
   * Pedro coletar reais com formulario LGPD.
   */
  kind?: 'real' | 'illustrative';
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div
      role="img"
      className="flex gap-1 mb-4"
      aria-label={`Avaliação: ${rating} de ${max} estrelas`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`text-lg leading-none ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function LocalTestimonials({
  headline = 'O que nossos clientes dizem',
  testimonials = [],
  kind = 'illustrative',
}: LocalTestimonialsProps) {
  return (
    <section
      data-testid="local-testimonials-section"
      aria-label="Depoimentos de clientes locais"
      className="py-12 md:py-16"
      style={{ backgroundColor: 'var(--color-muted)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <h2
          className="text-lg md:text-xl lg:text-2xl font-bold text-center mb-10"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          {headline}
        </h2>

        {testimonials.length === 0 ? (
          <p
            className="text-sm text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Depoimentos em breve.
          </p>
        ) : (
          <div
            data-testid="local-testimonials-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <article
                key={i}
                data-testid={`local-testimonial-card-${i + 1}`}
                tabIndex={0}
                className="flex flex-col p-6 rounded-xl transition-shadow duration-200 hover:shadow-md focus:outline-none focus:outline-2 focus:outline-offset-2"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  outlineColor: 'var(--color-accent)',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                {t.rating != null && <StarRating rating={t.rating} />}

                <blockquote className="mb-4 flex-1">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </blockquote>

                <footer>
                  <hr className="mb-3" style={{ borderColor: 'var(--color-border)' }} />
                  <strong
                    className="block text-sm font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {t.name}
                  </strong>
                  {t.role && (
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {t.role}
                    </span>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}

        {/* CL-250: rotulo de ilustrativos quando aplicavel */}
        {testimonials.length > 0 && kind === 'illustrative' && (
          <p
            data-testid="local-testimonials-illustrative-label"
            className="text-xs italic text-center mt-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            * Depoimentos ilustrativos para fins demonstrativos
          </p>
        )}
      </div>
    </section>
  );
}
