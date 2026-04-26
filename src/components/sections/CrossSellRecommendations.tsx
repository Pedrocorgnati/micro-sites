// src/components/sections/CrossSellRecommendations.tsx
// Fonte: TASK-5 intake-review (CL-114)
// Renderiza cards recomendando 2-3 outros micro-sites na pagina /obrigado.

import fs from 'node:fs';
import path from 'node:path';
import { getCrossSellSlugs } from '@/lib/cross-sell-rules';
import { OutboundLink } from '@/components/analytics/OutboundLink';
import { appendUtm } from '@/lib/utm-builder';
import type { SiteCategory } from '@/types';

interface RecommendationCard {
  slug: string;
  name: string;
  description: string;
  href: string;
}

interface Props {
  currentSlug: string;
  currentCategory: SiteCategory;
  limit?: number;
  baseUrl?: string;
}

function loadRecommendation(slug: string): RecommendationCard | null {
  const configPath = path.join(process.cwd(), 'sites', slug, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
      name?: string;
      seo?: { description?: string };
    };
    return {
      slug,
      name: raw.name ?? slug,
      description: raw.seo?.description?.slice(0, 140) ?? '',
      href: `/?rec=${encodeURIComponent(slug)}`,
    };
  } catch {
    return null;
  }
}

export function CrossSellRecommendations({
  currentSlug,
  currentCategory,
  limit = 3,
  baseUrl,
}: Props) {
  const slugs = getCrossSellSlugs(currentCategory, currentSlug, limit);
  // CL-323: aplicar UTM em cross-sell outbound para rastrear origem.
  const utm = {
    slug: currentSlug,
    category: currentCategory,
    campaign: 'cross-sell',
    content: 'recommendations',
  };
  const cards = slugs
    .map(loadRecommendation)
    .filter((c): c is RecommendationCard => c !== null)
    .map((c) => {
      const base = baseUrl ? { ...c, href: `${baseUrl}/${c.slug}` } : c;
      return { ...base, href: appendUtm(base.href, utm) };
    });

  if (cards.length === 0) return null;

  return (
    <section
      data-testid="cross-sell-section"
      aria-label="Recomendacoes relacionadas"
      className="w-full max-w-[1100px] mx-auto px-4 py-12"
    >
      <h2
        className="text-xl md:text-2xl font-bold mb-6 text-center"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
      >
        Voce tambem pode gostar
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <OutboundLink
            key={card.slug}
            data-testid={`cross-sell-card-${card.slug}`}
            data-analytics-event="cross_sell_click"
            data-analytics-slug={card.slug}
            href={card.href}
            fromSlug={currentSlug}
            className="block p-5 rounded-xl border transition-all duration-150 hover:shadow-md"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {card.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {card.description}
            </p>
            <span
              className="inline-flex items-center mt-3 text-sm font-semibold"
              style={{ color: 'var(--color-accent)' }}
            >
              Conhecer
              <span aria-hidden="true" className="ml-1">
                &rarr;
              </span>
            </span>
          </OutboundLink>
        ))}
      </div>
    </section>
  );
}
