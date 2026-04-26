import type { Metadata } from 'next';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { ContactForm } from '@/components/forms/ContactForm';
import { NoscriptFallback } from '@/components/sections/NoscriptFallback';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export async function generateMetadata(): Promise<Metadata> {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: 'Contato',
    description: `Entre em contato com ${config.name}. Respondemos em até 24 horas úteis.`,
    alternates: { canonical: '/contato' },
  };
}

export default function ContatoPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        <NoscriptFallback
          whatsappNumber={config.cta.whatsappNumber}
          message={config.cta.whatsappMessage}
          contactEmail={(config as { contactEmail?: string }).contactEmail}
          variant="contact"
        />
        <ContactForm config={config} />
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
