import type { Step } from '@/types';

interface HowItWorksProps {
  headline?: string;
  steps: Step[];
}

export function HowItWorks({
  headline = 'Como funciona em 3 passos',
  steps,
}: HowItWorksProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <section
      data-testid="how-it-works-section"
      aria-label="Como funciona"
      className="py-16"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          {headline}
        </h2>

        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-0">
          {steps.map((step, i) => (
            <div key={i} data-testid={`how-it-works-step-${i + 1}`} className="flex md:flex-1 flex-col items-center text-center gap-4 relative px-4">
              {/* Número */}
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full text-white font-bold text-xl shrink-0"
                style={{ backgroundColor: 'var(--color-accent)' }}
                aria-hidden="true"
              >
                {step.number ?? i + 1}
              </div>

              {/* Conector horizontal (desktop, entre itens) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-7 left-[calc(50%+28px)] right-0 h-px"
                  style={{ backgroundColor: '#D1D5DB', width: 'calc(100% - 56px)' }}
                  aria-hidden="true"
                />
              )}

              <div className="flex flex-col gap-2">
                <h3
                  className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
