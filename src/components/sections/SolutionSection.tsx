interface SolutionSectionProps {
  headline?: string;
  content: string;
}

export function SolutionSection({
  headline = 'Nossa solução',
  content,
}: SolutionSectionProps) {
  return (
    <section
      data-testid="solution-section"
      aria-label="Solução"
      className="py-16"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Barra accent */}
          <div
            className="w-12 h-1 rounded mb-6"
            style={{ backgroundColor: 'var(--color-accent)' }}
            aria-hidden="true"
          />
          <h2
            className="text-2xl md:text-3xl font-bold mb-8"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            {headline}
          </h2>
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </section>
  );
}
