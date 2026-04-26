import type { Feature } from '@/types';
import {
  Shield, Zap, Heart, Star, Check, Clock, Globe, Lock,
  Smile, Bolt, Target, TrendingUp, Award, Users, Layers,
  BarChart2, Settings, Search, MessageCircle, Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Shield, Zap, Heart, Star, Check, Clock, Globe, Lock,
  Smile, Bolt, Target, TrendingUp, Award, Users, Layers,
  BarChart2, Settings, Search, MessageCircle, Lightbulb,
};

const DEFAULT_ICONS: LucideIcon[] = [Shield, Zap, Star, Check, Globe, Target];

interface FeatureGridProps {
  headline?: string;
  features: Feature[];
}

export function FeatureGrid({
  headline = 'Por que escolher nossa solução?',
  features,
}: FeatureGridProps) {
  if (!features || features.length === 0) return null;

  const items = features.slice(0, 6);
  if (process.env.NODE_ENV !== 'production') {
    if (features.length < 3) console.warn('[FeatureGrid] Menos de 3 itens — ideal mínimo é 3');
    if (features.length > 6) console.warn('[FeatureGrid] Mais de 6 itens — truncando em 6');
  }

  return (
    <section
      data-testid="feature-grid-section"
      aria-label="Diferenciais"
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

        <div data-testid="feature-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((feature, i) => {
            const IconComponent = (feature.icon ? ICON_MAP[feature.icon] : undefined) ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length];
            return (
              <article
                key={i}
                data-testid={`feature-grid-item-${i + 1}`}
                className="flex flex-col gap-4 p-6 rounded-xl border transition-shadow duration-200 hover:shadow-md"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  aria-hidden="true"
                >
                  <IconComponent size={22} color="white" strokeWidth={2} />
                </div>

                <h3
                  className="text-lg font-semibold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
