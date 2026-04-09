'use client';

import { useState } from 'react';
import Script from 'next/script';
import type { FAQ } from '@/types';

interface FAQAccordionProps {
  headline?: string;
  faqs: FAQ[];
  showSchema?: boolean;
}

export function FAQAccordion({
  headline = 'Perguntas Frequentes',
  faqs,
  showSchema = true,
}: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section
      data-testid="faq-section"
      aria-label="Perguntas frequentes"
      className="py-16"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {showSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}

      <div className="max-w-[1200px] mx-auto px-4">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          {headline}
        </h2>

        <div data-testid="faq-list" className="max-w-3xl mx-auto divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} data-testid={`faq-item-${i + 1}`}>
                <button
                  type="button"
                  data-testid={`faq-question-button-${i + 1}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left min-h-[52px] transition-colors duration-150"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="text-base font-semibold leading-snug"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {faq.question}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="shrink-0 transition-transform duration-200"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  hidden={!isOpen}
                  className="pb-5 text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
