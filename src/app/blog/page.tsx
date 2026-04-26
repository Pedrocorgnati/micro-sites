import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { loadSiteConfig, loadBlogArticles, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { BlogList } from '@/components/blog/BlogList';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { BLOG_CONFIG } from '@/lib/constants';

const BlogSearch = dynamic(
  () => import('@/components/blog/BlogSearch').then((m) => m.BlogSearch),
);

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export async function generateMetadata(): Promise<Metadata> {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: 'Blog',
    description: `Artigos e conteúdos de ${config.name}.`,
    alternates: { canonical: '/blog' },
  };
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export function buildBlogPagesAlternates(
  page: number,
  totalPages: number,
): { canonical: string; prev?: string; next?: string } {
  return {
    canonical: page <= 1 ? '/blog' : `/blog/page/${page}`,
    prev: page > 1 ? (page === 2 ? '/blog' : `/blog/page/${page - 1}`) : undefined,
    next: page < totalPages ? `/blog/page/${page + 1}` : undefined,
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const config = loadSiteConfig(SITE_SLUG);
  const allArticles = await loadBlogArticles(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10));
  const totalPages = Math.ceil(allArticles.length / BLOG_CONFIG.ARTICLES_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const pagedArticles = allArticles.slice(
    (safePage - 1) * BLOG_CONFIG.ARTICLES_PER_PAGE,
    safePage * BLOG_CONFIG.ARTICLES_PER_PAGE,
  );

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main id="main-content" data-testid="main-content" tabIndex={-1} className="py-12" style={{ backgroundColor: 'var(--color-muted)' }}>
        <div className="max-w-[1200px] mx-auto px-4">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            Blog
          </h1>
          <p className="mb-10 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Conteúdos, dicas e novidades de {config.name}.
          </p>

          {allArticles.length === 0 ? (
            <EmptyState
              title="Novos artigos em breve"
              description="Estamos preparando novos conteúdos. Enquanto isso, fale conosco para tirar dúvidas."
              cta={
                <Link
                  href="/contato"
                  data-testid="blog-empty-cta"
                  className="inline-block px-5 py-3 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                >
                  Falar no WhatsApp
                </Link>
              }
            />
          ) : allArticles.length >= 5 ? (
            <BlogSearch articles={allArticles} siteSlug={SITE_SLUG} />
          ) : (
            <>
              <BlogList articles={pagedArticles} siteSlug={SITE_SLUG} />
              <BlogPagination currentPage={safePage} totalPages={totalPages} />
            </>
          )}
        </div>
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}

