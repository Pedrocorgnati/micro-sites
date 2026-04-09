import Link from 'next/link';
import type { BlogArticle } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogListProps {
  articles: BlogArticle[];
  siteSlug: string;
}

export function BlogList({ articles, siteSlug: _siteSlug }: BlogListProps) {
  if (articles.length === 0) {
    return (
      <div data-testid="blog-empty-state" className="flex flex-col items-center justify-center gap-4 py-24 text-center px-4">
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          Artigos em breve. Fique ligado!
        </p>
        <Link
          data-testid="blog-empty-state-cta"
          href="/contato"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Falar com especialista
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="blog-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <article
          key={article.slug}
          data-testid={`blog-article-card-${article.slug}`}
          className="flex flex-col rounded-xl border overflow-hidden transition-shadow duration-200 hover:shadow-md"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex flex-col gap-3 p-6 flex-1">
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-muted)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h2
              className="text-base font-semibold leading-snug"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
            >
              {article.title}
            </h2>

            {article.description && (
              <p
                className="text-sm leading-relaxed line-clamp-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {article.description}
              </p>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between">
              <time
                dateTime={article.date}
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {format(new Date(article.date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                {article.readingTime && ` · ${article.readingTime} min`}
              </time>

              <Link
                data-testid={`blog-article-read-link-${article.slug}`}
                href={`/blog/${article.slug}`}
                className="text-sm font-semibold transition-colors duration-150"
                style={{ color: 'var(--color-accent)' }}
                aria-label={`Ler artigo: ${article.title}`}
              >
                Ler artigo →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
