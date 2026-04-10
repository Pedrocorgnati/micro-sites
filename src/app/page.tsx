import Script from 'next/script';
import { loadSiteConfig, loadSiteContent, loadBlogArticles, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { HeroSection } from '@/components/sections/HeroSection';
import { ProblemSection } from '@/components/sections/ProblemSection';
import { SolutionSection } from '@/components/sections/SolutionSection';
import { FeatureGrid } from '@/components/sections/FeatureGrid';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { TrustSection } from '@/components/sections/TrustSection';
import { FAQAccordion } from '@/components/sections/FAQAccordion';
import { CTASection } from '@/components/sections/CTASection';
import { LocalTestimonials } from '@/components/sections/LocalTestimonials';
import { Calculator } from '@/components/sections/Calculator';
import type { CalculatorInput } from '@/types';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export default function HomePage() {
  const config = loadSiteConfig(SITE_SLUG);
  const content = loadSiteContent(SITE_SLUG);
  const articles = loadBlogArticles(SITE_SLUG);
  const isB = config.category === 'B';
  const isA = config.category === 'A';
  const isD = config.category === 'D';
  const accentStyle = getAccentStyle(config);

  // Calculator inputs para sites Cat D
  const calculatorInputs: CalculatorInput[] = (config as { calculatorInputs?: CalculatorInput[] }).calculatorInputs ?? [];

  const hasFaqs = (content.faqs?.items?.length ?? 0) > 0;

  // JSON-LD schemas
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.seo.canonical ?? '',
    description: config.seo.description,
  };

  const howToSchema = content.howItWorks?.steps
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: content.howItWorks.headline ?? 'Como funciona',
        step: content.howItWorks.steps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.description,
        })),
      }
    : null;

  const navLinks = [
    { label: 'Início', href: '/' },
    ...(articles.length > 0 ? [{ label: 'Blog', href: '/blog' }] : []),
    ...(hasFaqs ? [{ label: 'FAQ', href: '/faq' }] : []),
    { label: 'Contato', href: '/contato' },
  ];

  return (
    <div style={accentStyle}>
      <Header
        siteName={config.name}
        navLinks={navLinks}
        ctaLabel={config.cta.primaryLabel}
        ctaHref="/contato"
      />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        {/* JSON-LD */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {howToSchema && (
          <Script
            id="schema-howto"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
          />
        )}

        <HeroSection
          headline={content.hero?.headline ?? config.headline ?? config.name}
          subheadline={content.hero?.subheadline ?? config.subheadline ?? config.seo.description}
          ctaLabel={config.cta.primaryLabel}
          ctaHref="/contato"
          whatsappNumber={config.cta.whatsappNumber}
          whatsappMessage={config.cta.whatsappMessage}
        />

        {isB ? (
          <>
            {content.solution && (
              <SolutionSection
                headline={content.solution.headline}
                content={content.solution.content}
              />
            )}
            {content.problem && (
              <ProblemSection
                headline={content.problem.headline}
                content={content.problem.content}
              />
            )}
          </>
        ) : (
          <>
            {content.problem && (
              <ProblemSection
                headline={content.problem.headline}
                content={content.problem.content}
              />
            )}
            {content.solution && (
              <SolutionSection
                headline={content.solution.headline}
                content={content.solution.content}
              />
            )}
          </>
        )}

        {content.features && content.features.items.length > 0 && (
          <FeatureGrid
            headline={content.features.headline}
            features={content.features.items}
          />
        )}

        {/* LocalTestimonials — apenas Cat A (INT-027) */}
        {isA && (content.trust?.testimonials?.length ?? 0) > 0 && (
          <LocalTestimonials
            testimonials={content.trust?.testimonials}
          />
        )}

        {/* Calculator — apenas Cat D */}
        {isD && calculatorInputs.length > 0 && (
          <Calculator
            inputs={calculatorInputs}
            config={config}
          />
        )}

        {content.howItWorks && content.howItWorks.steps.length > 0 && (
          <HowItWorks
            headline={content.howItWorks.headline}
            steps={content.howItWorks.steps}
          />
        )}

        {content.trust && (
          <TrustSection
            headline={content.trust.headline}
            stats={content.trust.stats}
            testimonials={content.trust.testimonials}
          />
        )}

        {hasFaqs && (
          <FAQAccordion
            headline={content.faqs!.headline}
            faqs={content.faqs!.items}
          />
        )}

        <CTASection
          headline={content.cta?.headline}
          subheadline={content.cta?.subheadline}
          ctaLabel={config.cta.primaryLabel}
          ctaHref="/contato"
          whatsappNumber={config.cta.whatsappNumber}
          whatsappMessage={config.cta.whatsappMessage}
        />
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
