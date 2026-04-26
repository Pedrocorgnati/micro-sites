import Link from 'next/link';
import type { BlogArticle, SiteConfig } from '@/types';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogLayoutProps {
  article: BlogArticle;
  config: SiteConfig;
  relatedArticles?: BlogArticle[];
  prevArticle?: Pick<BlogArticle, 'slug' | 'title'> | null;
  nextArticle?: Pick<BlogArticle, 'slug' | 'title'> | null;
}

export function BlogLayout({ article, config, relatedArticles = [], prevArticle, nextArticle }: BlogLayoutProps) {
  const waUrl = `https://wa.me/${config.cta.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(config.cta.whatsappMessage)}`;

  return (
    <article data-testid="blog-article" className="max-w-[1200px] mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Blog', href: '/blog' },
          { label: article.title },
        ]}
      />

      <div className="mt-6 flex flex-col lg:flex-row gap-10">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
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

          <h1
            className="text-2xl md:text-4xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            {article.title}
          </h1>

          {/* Meta */}
          <div
            className="flex flex-wrap items-center gap-3 text-sm mb-8 pb-6 border-b"
            style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
          >
            {article.date && (
              <time dateTime={article.date}>
                {format(new Date(article.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </time>
            )}
            {article.author && <span>· {article.author}</span>}
            {article.readingTime && <span>· {article.readingTime} min de leitura</span>}
          </div>

          {/* Body */}
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {/* Inline CTA after reading */}
          <div
            className="mt-12 p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--color-muted)',
              borderColor: 'var(--color-border)',
            }}
          >
            <p
              className="text-base font-semibold mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
            >
              Gostou do conteúdo? Podemos ajudar o seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                data-testid="blog-article-inline-cta-contact"
                href="/contato"
                className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Entrar em contato
              </Link>
              <a
                data-testid="blog-article-inline-cta-whatsapp"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm border-2 transition-all duration-150 active:scale-95"
                style={{ color: '#25D366', borderColor: '#25D366' }}
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>

          {/* Prev / Next navigation */}
          {(prevArticle ?? nextArticle) && (
            <nav
              data-testid="blog-article-prevnext"
              aria-label="Navegação entre artigos"
              className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between gap-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {prevArticle ? (
                <Link
                  data-testid="blog-article-prev"
                  href={`/blog/${prevArticle.slug}`}
                  className="flex flex-col gap-1 max-w-[48%] group"
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    ← Artigo anterior
                  </span>
                  <span
                    className="text-sm font-semibold transition-colors duration-150"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {prevArticle.title}
                  </span>
                </Link>
              ) : <div />}

              {nextArticle && (
                <Link
                  data-testid="blog-article-next"
                  href={`/blog/${nextArticle.slug}`}
                  className="flex flex-col gap-1 max-w-[48%] sm:text-right group"
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    Próximo artigo →
                  </span>
                  <span
                    className="text-sm font-semibold transition-colors duration-150"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {nextArticle.title}
                  </span>
                </Link>
              )}
            </nav>
          )}

          {/* Related posts — mobile (after article) */}
          {relatedArticles.length > 0 && (
            <div className="mt-10 lg:hidden">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
              >
                Artigos relacionados
              </h2>
              <div className="flex flex-col gap-3">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="text-sm font-medium transition-colors duration-150"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {rel.title} →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — desktop only */}
        <aside data-testid="blog-article-sidebar" className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-6 flex flex-col gap-6">
            {/* CTA box */}
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-muted)',
                borderColor: 'var(--color-border)',
              }}
            >
              <p
                className="text-base font-semibold mb-2"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
              >
                Precisa de ajuda?
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {config.seo.description.slice(0, 80)}…
              </p>
              <Link
                href="/contato"
                className="block text-center px-4 py-3 min-h-[44px] rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {config.cta.primaryLabel}
              </Link>
            </div>

            {/* Related posts */}
            {relatedArticles.length > 0 && (
              <div>
                <h2
                  className="text-sm font-semibold mb-3"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
                >
                  Artigos relacionados
                </h2>
                <div className="flex flex-col gap-2">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/blog/${rel.slug}`}
                      className="text-sm transition-colors duration-150"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {rel.title} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
