import type { Metadata } from 'next';
import Link from 'next/link';
import { loadSiteConfig, getAccentStyle, buildWhatsAppUrl } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { CrossSellRecommendations } from '@/components/sections/CrossSellRecommendations';
import { appendUtm, type UtmInput } from '@/lib/utm-builder';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export const metadata: Metadata = {
  title: 'Mensagem recebida!',
  robots: { index: false, follow: false },
};

interface CrossLink {
  href: string;
  anchor: string;
  context: 'footer' | 'article' | 'cta' | 'resultado';
}

export default function ObrigadoPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);
  const waUrl = buildWhatsAppUrl(config.cta.whatsappNumber, config.cta.whatsappMessage);

  const allCrossLinks: CrossLink[] = (config as { crossLinks?: CrossLink[] }).crossLinks ?? [];
  const ctaCrossLinks = allCrossLinks.filter((cl) => cl.context === 'cta').slice(0, 3);

  // CL-323 / CL-126: aplicar UTM canonico nos links cross-sell de /obrigado
  // para rastrear a distribuicao de leads entre micro-sites.
  const crossSellUtm: UtmInput = {
    slug: SITE_SLUG,
    category: config.category,
    campaign: 'cross-sell',
    content: 'obrigado',
  };

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main
        id="main-content"
        data-testid="main-content"
        tabIndex={-1}
        className="flex flex-col items-center justify-center px-4 py-24 min-h-[60vh] text-center"
      >
        {/* Check icon */}
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: '#D1FAE5' }}
          aria-hidden="true"
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          Mensagem recebida!
        </h1>

        <p
          className="text-base max-w-md mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Obrigado pelo contato. Nossa equipe analisará sua mensagem e retornará em até 24 horas
          úteis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <a
            data-testid="obrigado-whatsapp-button"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
            style={{ backgroundColor: '#25D366' }}
          >
            Falar agora no WhatsApp
          </a>
          <Link
            data-testid="obrigado-home-link"
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm border-2 transition-all duration-150 active:scale-95"
            style={{
              color: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
            }}
          >
            Voltar ao Início
          </Link>
        </div>

        {/* Cross-sell */}
        {ctaCrossLinks.length >= 2 && (
          <section
            data-testid="obrigado-cross-sell"
            className="w-full max-w-2xl"
            aria-label="Você também pode se interessar por"
          >
            <h2
              className="text-base font-semibold mb-4"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Você também pode se interessar por:
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {ctaCrossLinks.map((cl) => (
                <a
                  key={cl.href}
                  href={appendUtm(cl.href, crossSellUtm)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`obrigado-cross-sell-link`}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-shadow duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span
                    className="text-sm font-medium text-center leading-snug"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {cl.anchor}
                  </span>
                  <span
                    className="text-xs font-semibold mt-auto"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Conhecer →
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <CrossSellRecommendations
          currentSlug={SITE_SLUG}
          currentCategory={config.category}
        />
      </main>

      <Footer
        siteName={config.name}
        showSystemForgeLogo={config.showSystemForgeLogo}
        links={config.footerLinks}
        contactEmail={(config as { contactEmail?: string }).contactEmail}
        siteSlug={SITE_SLUG}
        siteCategory={config.category}
      />
    </div>
  );
}
