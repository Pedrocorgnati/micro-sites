import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSiteConfig, loadSiteContent, getAccentStyle } from '@/lib/config-loader';
import { buildFAQSchema } from '@/lib/schema-markup';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { FAQAccordion } from '@/components/sections/FAQAccordion';
import { CTASection } from '@/components/sections/CTASection';
import { AdSlot } from '@/components/ads/AdSlot';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export function generateMetadata(): Metadata {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: 'Perguntas Frequentes',
    description: `Respostas para as perguntas mais frequentes sobre ${config.name}. Tire suas dúvidas rapidamente antes de entrar em contato.`,
    alternates: { canonical: '/faq' },
  };
}

export default function FAQPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const content = loadSiteContent(SITE_SLUG);
  const accentStyle = getAccentStyle(config);

  const faqs = content.faqs?.items ?? [];

  // CL-223/CL-369: /faq condicional — 404 quando nao ha FAQs publicaveis
  const faqEnabled = (config as { faqEnabled?: boolean }).faqEnabled !== false;
  if (!faqEnabled || faqs.length === 0) {
    notFound();
  }

  // FAQPage JSON-LD renderizado no server component para garantir presença no HTML estático
  const faqSchema = buildFAQSchema(faqs);

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        <script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <FAQAccordion
          headline={content.faqs?.headline ?? 'Perguntas Frequentes'}
          faqs={faqs}
          showSchema={false}
        />

        <CTASection
          headline="Ainda tem dúvidas?"
          subheadline="Nossa equipe está pronta para responder todas as suas perguntas."
          ctaLabel="Enviar Mensagem"
          ctaHref="/contato"
          whatsappNumber={config.cta.whatsappNumber}
          whatsappMessage={config.cta.whatsappMessage}
        />

        {/* ADS-15 — /faq e ALLOWED por default (conteudo editorial). */}
        <AdSlot config={config} pathname="/faq" slot="footer" />
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
