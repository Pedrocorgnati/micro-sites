interface ProblemSectionProps {
  headline?: string;
  content: string;
}

export function ProblemSection({
  headline = 'Você reconhece algum desses problemas?',
  content,
}: ProblemSectionProps) {
  return (
    <section
      data-testid="problem-section"
      aria-label="Problema"
      className="border-l-4 py-16"
      style={{ backgroundColor: '#FEF2F2', borderColor: '#EF4444' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="max-w-3xl">
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
