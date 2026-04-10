import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { FullResult } from '@/components/sections/FullResult';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export default function ResultadoPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  return (
    <div style={accentStyle}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-white"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        Pular para o conteúdo
      </a>

      <Header
        siteName={config.name}
        navLinks={[
          { label: 'Início', href: '/' },
          { label: 'Contato', href: '/contato' },
        ]}
        ctaLabel={config.cta.primaryLabel}
        ctaHref="/contato"
      />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        <FullResult config={config} />
      </main>

      <Footer
        siteName={config.name}
        showSystemForgeLogo={config.showSystemForgeLogo}
        links={config.footerLinks}
      />

      <WhatsAppButton
        phone={config.cta.whatsappNumber}
        message={config.cta.whatsappMessage}
      />
    </div>
  );
}
