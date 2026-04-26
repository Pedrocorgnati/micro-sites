import type { Metadata } from 'next';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { TermsOfUse } from '@/components/lgpd/TermsOfUse';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  alternates: { canonical: '/termos' },
  robots: { index: true, follow: true },
};

export default function TermosPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main
        id="main-content"
        data-testid="main-content"
        tabIndex={-1}
        className="max-w-[1200px] mx-auto px-4 py-12"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <TermsOfUse siteName={config.name} controllerContact="privacidade@systemforge.com.br" />
      </main>

      <Footer
        siteName={config.name}
        showSystemForgeLogo={config.showSystemForgeLogo}
        links={config.footerLinks}
        contactEmail={(config as { contactEmail?: string }).contactEmail}
      />
    </div>
  );
}
