import type { Metadata } from 'next';
import { loadSiteConfig, loadBlogArticles, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { BlogList } from '@/components/blog/BlogList';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export async function generateMetadata(): Promise<Metadata> {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: 'Blog',
    description: `Artigos e conteúdos de ${config.name}.`,
  };
}

export default function BlogPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const articles = loadBlogArticles(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

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

          <BlogList articles={articles} siteSlug={SITE_SLUG} />
        </div>
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
