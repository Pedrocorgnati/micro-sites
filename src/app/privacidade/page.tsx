import type { Metadata } from 'next';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PrivacyPolicy } from '@/components/lgpd/PrivacyPolicy';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
};

export default function PrivacidadePage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-[1200px] mx-auto px-4 py-12"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <PrivacyPolicy siteName={config.name} />
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} />
    </div>
  );
}
