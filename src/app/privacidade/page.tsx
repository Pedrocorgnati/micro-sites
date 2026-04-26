import type { Metadata } from 'next';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PrivacyPolicy } from '@/components/lgpd/PrivacyPolicy';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export function generateMetadata(): Metadata {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: 'Política de Privacidade',
    description: `Política de privacidade e tratamento de dados pessoais de ${config.name} conforme a Lei Geral de Proteção de Dados (LGPD). Consulte prazos de retenção e seus direitos como titular.`,
    alternates: { canonical: '/privacidade' },
  };
}

export default function PrivacidadePage() {
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
        <PrivacyPolicy siteName={config.name} controllerContact="privacidade@systemforge.com.br" />
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
    </div>
  );
}
