import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadSiteConfig, loadBlogArticles, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { BlogList } from '@/components/blog/BlogList';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { BLOG_CONFIG } from '@/lib/constants';

export const dynamic = 'force-static';
export const dynamicParams = false;

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

interface PageProps {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams(): Promise<{ page: string }[]> {
  const articles = await loadBlogArticles(SITE_SLUG);
  const totalPages = Math.ceil(articles.length / BLOG_CONFIG.ARTICLES_PER_PAGE);
  if (totalPages <= 1) return [];
  // Paginas 2..N (pagina 1 fica em /blog)
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await params;
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: `Blog — Pagina ${page}`,
    description: `Artigos e conteudos de ${config.name} — pagina ${page}.`,
    alternates: { canonical: `/blog/page/${page}` },
  };
}

export default async function BlogPagedPage({ params }: PageProps) {
  const { page } = await params;
  const pageNum = parseInt(page, 10);
  if (!Number.isFinite(pageNum) || pageNum < 2) notFound();

  const config = loadSiteConfig(SITE_SLUG);
  const allArticles = await loadBlogArticles(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  const totalPages = Math.ceil(allArticles.length / BLOG_CONFIG.ARTICLES_PER_PAGE);
  if (pageNum > totalPages) notFound();

  const pagedArticles = allArticles.slice(
    (pageNum - 1) * BLOG_CONFIG.ARTICLES_PER_PAGE,
    pageNum * BLOG_CONFIG.ARTICLES_PER_PAGE,
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
            Blog — Pagina {pageNum}
          </h1>
          <p className="mb-10 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            <Link href="/blog" className="underline" style={{ color: 'var(--color-accent)' }}>
              ← Voltar para o inicio do blog
            </Link>
          </p>

          <BlogList articles={pagedArticles} siteSlug={SITE_SLUG} />
          <BlogPagination currentPage={pageNum} totalPages={totalPages} />
        </div>
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
