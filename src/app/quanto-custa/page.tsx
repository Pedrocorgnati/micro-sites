import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Calculator } from '@/components/sections/Calculator';
import { NoscriptFallback } from '@/components/sections/NoscriptFallback';
import { AdSlot } from '@/components/ads/AdSlot';
import type { CalculatorInput } from '@/types';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export async function generateMetadata(): Promise<Metadata> {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: `Quanto Custa ${config.name}? | Calculadora Gratuita`,
    description: `Calcule gratuitamente quanto vai custar contratar ${config.name}. Simulação rápida e sem compromisso.`,
  };
}

export default function QuantoCustaPage() {
  const config = loadSiteConfig(SITE_SLUG);

  if (config.category !== 'D') {
    redirect('/');
  }

  const calculatorInputs: CalculatorInput[] =
    (config as { calculatorInputs?: CalculatorInput[] }).calculatorInputs ?? [];
  const accentStyle = getAccentStyle(config);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: config.name,
    description: config.seo.description,
    provider: {
      '@type': 'Organization',
      name: config.name,
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
          id="schema-quanto-custa"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />

        <div className="max-w-[1200px] mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Início', href: '/' },
              { label: 'Quanto Custa' },
            ]}
            className="mb-6"
          />

          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            Quanto custa?
          </h1>
          <p className="mb-10 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Use nossa calculadora gratuita para descobrir o valor do seu projeto em menos de 2 minutos.
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
              headline="Calcule o custo do seu projeto"
              subheadline="Responda algumas perguntas rápidas e receba uma estimativa personalizada."
            />
          )}
        </div>

        {/* ADS-17 — slot footer (so renderiza se config.adsense.routesAllowed inclui 'quanto-custa') */}
        <AdSlot config={config} pathname="/quanto-custa" slot="footer" />
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
