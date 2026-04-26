import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Calculator } from '@/components/sections/Calculator';
import { NoscriptFallback } from '@/components/sections/NoscriptFallback';
import type { CalculatorInput } from '@/types';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export async function generateMetadata(): Promise<Metadata> {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: `Diagnóstico Gratuito | ${config.name}`,
    description: `Faça o diagnóstico gratuito da sua presença digital com ${config.name}. Descubra o que melhorar em minutos.`,
  };
}

export default function DiagnosticoPage() {
  const config = loadSiteConfig(SITE_SLUG);

  if (config.category !== 'D') {
    redirect('/');
  }

  const calculatorInputs: CalculatorInput[] =
    (config as { calculatorInputs?: CalculatorInput[] }).calculatorInputs ?? [];
  const accentStyle = getAccentStyle(config);

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Diagnóstico Gratuito — ${config.name}`,
    description: config.seo.description,
    provider: {
      '@type': 'Organization',
      name: config.name,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  };

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main
        id="main-content"
        data-testid="main-content"
        tabIndex={-1}
        className="py-12"
        style={{ backgroundColor: 'var(--color-muted)' }}
      >
        <script
          id="schema-diagnostico"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />

        <div className="max-w-[1200px] mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Início', href: '/' },
              { label: 'Diagnóstico Gratuito' },
            ]}
            className="mb-6"
          />

          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            Diagnóstico gratuito
          </h1>
          <p className="mb-10 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Responda algumas perguntas rápidas e descubra exatamente o que o seu negócio precisa para crescer no digital.
          </p>

          <NoscriptFallback
            whatsappNumber={config.cta.whatsappNumber}
            message={config.cta.whatsappMessage}
            contactEmail={(config as { contactEmail?: string }).contactEmail}
            variant="calculator"
          />

          {calculatorInputs.length > 0 && (
            <Calculator
              inputs={calculatorInputs}
              config={config}
              type="diagnostic"
              headline="Faça seu diagnóstico agora"
              subheadline="Grátis, sem compromisso. Resultado em menos de 2 minutos."
            />
          )}
        </div>
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
