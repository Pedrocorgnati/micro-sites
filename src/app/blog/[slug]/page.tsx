import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  loadSiteConfig,
  loadBlogArticles,
  loadBlogArticle,
  getAccentStyle,
} from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { BlogAnalytics } from '@/components/blog/BlogAnalytics';
import { buildArticleSchema } from '@/lib/schema-markup';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await loadBlogArticles(SITE_SLUG);
  // output: 'export' requer ao menos 1 path; placeholder é descartado via notFound()
  if (articles.length === 0) return [{ slug: '_placeholder' }];
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = loadBlogArticle(slug, SITE_SLUG);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.date,
      authors: article.author ? [article.author] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const config = loadSiteConfig(SITE_SLUG);
  const article = loadBlogArticle(slug, SITE_SLUG);

  if (!article) notFound();

  const allArticles = await loadBlogArticles(SITE_SLUG);
  const related = allArticles.filter((a) => a.slug !== slug).slice(0, 3);
  const currentIdx = allArticles.findIndex((a) => a.slug === slug);
  const prevArticle = currentIdx > 0 ? allArticles[currentIdx - 1] : null;
  const nextArticle = currentIdx >= 0 && currentIdx < allArticles.length - 1 ? allArticles[currentIdx + 1] : null;
  const accentStyle = getAccentStyle(config);
  const articleSchema = buildArticleSchema(article, config, '');

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main
        id="main-content"
        data-testid="main-content"
        tabIndex={-1}
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <script
          id="schema-article"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <BlogLayout article={article} config={config} relatedArticles={related} prevArticle={prevArticle} nextArticle={nextArticle} />
        <BlogAnalytics
          siteSlug={SITE_SLUG}
          articleSlug={slug}
          readingTime={article.readingTime}
        />
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
