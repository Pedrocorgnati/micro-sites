import type { Metadata } from 'next';
import { loadSiteConfig, loadSiteContent, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { FAQAccordion } from '@/components/sections/FAQAccordion';
import { CTASection } from '@/components/sections/CTASection';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export const metadata: Metadata = {
  title: 'Perguntas Frequentes',
};

export default function FAQPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const content = loadSiteContent(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  const faqs = content.faqs?.items ?? [];

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        <FAQAccordion
          headline={content.faqs?.headline ?? 'Perguntas Frequentes'}
          faqs={faqs}
          showSchema
        />

        <CTASection
          headline="Ainda tem dúvidas?"
          subheadline="Nossa equipe está pronta para responder todas as suas perguntas."
          ctaLabel="Enviar Mensagem"
          ctaHref="/contato"
          whatsappNumber={config.cta.whatsappNumber}
          whatsappMessage={config.cta.whatsappMessage}
        />
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
