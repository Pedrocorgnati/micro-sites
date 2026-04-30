// ADR-0002 — Esta page usa conditionals por config.category (Opcao B).
// Decisao formalizada em docs/adrs/ADR-0002-templates-as-conditionals.md.
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { loadSiteConfig, loadSiteContent, loadBlogArticles, getAccentStyle, buildWhatsAppUrl } from '@/lib/config-loader';
import { buildFAQSchema } from '@/lib/schema-markup';
import { buildNextMetadata } from '@/lib/seo-helpers';
import { assertCategoryInvariants, filterValidSections, getSectionOrder, type Category } from '@/lib/section-order';
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
import { AdSlot } from '@/components/ads/AdSlot';
import type { CalculatorInput } from '@/types';

// Dynamic imports — componentes condicionais por categoria (não inflam bundle de outros sites)
const Calculator = dynamic(
  () => import('@/components/sections/Calculator').then((m) => m.Calculator),
  { ssr: false, loading: () => <div className="animate-pulse h-96 rounded-xl" style={{ backgroundColor: 'var(--color-muted)' }} /> },
);

const F01EmbeddedCalculator = dynamic(
  () => import('@/components/sections/F01EmbeddedCalculator').then((m) => m.F01EmbeddedCalculator),
  { ssr: false, loading: () => <div className="animate-pulse h-96 rounded-xl" style={{ backgroundColor: 'var(--color-muted)' }} /> },
);

const ExitIntentPopup = dynamic(
  () => import('@/components/ui/ExitIntentPopup').then((m) => m.ExitIntentPopup),
  { ssr: false },
);

const WaitlistForm = dynamic(
  () => import('@/components/forms/WaitlistForm').then((m) => m.WaitlistForm),
  { ssr: false },
);

/**
 * Template Logic — ADR-002
 * Categorias (A-F) são renderizadas via conditionals neste arquivo
 * em vez de src/templates/ separados. Decisão consciente para 6 categorias.
 * Ver docs/ARCHITECTURE-DECISIONS.md#adr-002
 */
const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export function generateMetadata(): Metadata {
  const config = loadSiteConfig(SITE_SLUG);
  return buildNextMetadata(config, config.seo.canonical ?? '', '/');
}

export default function HomePage() {
  const config = loadSiteConfig(SITE_SLUG);
  if (process.env.NODE_ENV !== 'production') {
    assertCategoryInvariants(config.category as Category);
    // US-005 cenário ERROR — BUILD_050: descarta sessões inválidas do pipeline
    // e sinaliza drift no SECTION_ORDER_BY_CATEGORY de forma não-fatal.
    filterValidSections(getSectionOrder(config.category), (invalid) => {
      console.warn(`[BUILD_050] Seção inválida ignorada em ${SITE_SLUG}: "${invalid}"`);
    });
  }
  const content = loadSiteContent(SITE_SLUG);
  const articles = loadBlogArticles(SITE_SLUG);
  const isB = config.category === 'B';
  const isA = config.category === 'A';
  const isD = config.category === 'D';
  const isE = config.category === 'E';
  const accentStyle = getAccentStyle(config);

  // Calculator inputs para sites Cat D
  const calculatorInputs: CalculatorInput[] = (config as { calculatorInputs?: CalculatorInput[] }).calculatorInputs ?? [];

  // CL-393: F01 embedded calculator — referencia D01
  type EmbeddedCalcConfig = {
    embeddedCalculator?: { enabled?: boolean; source?: string; headline?: string };
  };
  const embeddedCalc = (config as EmbeddedCalcConfig).embeddedCalculator;
  let embeddedCalcInputs: CalculatorInput[] = [];
  if (embeddedCalc?.enabled && embeddedCalc.source) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sourceConfig = require(`../../sites/${embeddedCalc.source}/config.json`) as {
        calculatorInputs?: CalculatorInput[];
      };
      embeddedCalcInputs = sourceConfig.calculatorInputs ?? [];
    } catch {
      // source ausente — render no-op
    }
  }
  const isF01 = config.slug?.startsWith('f01');

  const hasFaqs = (content.faqs?.items?.length ?? 0) > 0;

  // JSON-LD schemas
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.seo.canonical ?? '',
    description: config.seo.description,
  };

  const howToSchema = content.howItWorks?.steps && config.schema.includes('HowTo')
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

  // Cat A — LocalBusiness + Review schemas (INT-071)
  const localBusinessData = config.localBusiness;
  const localBusinessSchema = isA && config.schema.includes('LocalBusiness')
    ? {
        '@context': 'https://schema.org',
        '@type': localBusinessData?.type ?? 'LocalBusiness',
        name: config.name,
        url: config.seo.canonical ?? '',
        telephone: localBusinessData?.phone ?? `+${config.cta.whatsappNumber}`,
        ...(localBusinessData?.address && {
          address: { '@type': 'PostalAddress', streetAddress: localBusinessData.address },
        }),
        ...(localBusinessData?.openingHours && { openingHours: localBusinessData.openingHours }),
        ...(localBusinessData?.priceRange && { priceRange: localBusinessData.priceRange }),
      }
    : null;

  const reviewSchemas = isA
    ? (content.trust?.testimonials ?? []).map((t) => ({
        '@context': 'https://schema.org',
        '@type': 'Review',
        reviewBody: t.quote,
        author: { '@type': 'Person', name: t.name },
        itemReviewed: { '@type': 'LocalBusiness', name: config.name },
        ...(t.rating != null && {
          reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 },
        }),
      }))
    : [];

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
        headerBadge={(config as { headerBadge?: string }).headerBadge}
        category={config.category}
        whatsappUrl={buildWhatsAppUrl(config.cta.whatsappNumber, config.cta.whatsappMessage)}
      />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        {/* JSON-LD — use native <script> for SSG inline rendering */}
        <script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {howToSchema && (
          <script
            id="schema-howto"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
          />
        )}
        {hasFaqs && config.schema.includes('FAQPage') && (
          <script
            id="schema-faqpage"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(content.faqs!.items)) }}
          />
        )}
        {/* Cat A — LocalBusiness schema (INT-071) */}
        {localBusinessSchema && (
          <script
            id="schema-localbusiness"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          />
        )}
        {/* Cat A — Review schemas por depoimento (INT-071) */}
        {reviewSchemas.map((schema, i) => (
          <script
            key={`review-${i}`}
            id={`schema-review-${i}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        <HeroSection
          headline={content.hero?.headline ?? config.headline ?? config.name}
          subheadline={content.hero?.subheadline ?? config.subheadline ?? config.seo.description}
          ctaLabel={config.cta.primaryLabel}
          ctaHref="/contato"
          whatsappNumber={config.cta.whatsappNumber}
          whatsappMessage={config.cta.whatsappMessage}
        />

        {/* Calculator — Cat D: seção 2, logo após o Hero (INT-066) */}
        {isD && calculatorInputs.length > 0 && (
          <Calculator
            inputs={calculatorInputs}
            config={config}
          />
        )}

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

        {content.howItWorks && content.howItWorks.steps.length > 0 && (
          <HowItWorks
            headline={content.howItWorks.headline}
            steps={content.howItWorks.steps}
          />
        )}

        {/* CL-393: F01 — calculadora embutida referenciada de D01, apos HowItWorks */}
        {isF01 && embeddedCalc?.enabled && embeddedCalcInputs.length > 0 && (
          <F01EmbeddedCalculator
            config={config}
            referencedInputs={embeddedCalcInputs}
            sourceSlug={embeddedCalc.source}
          />
        )}

        {/* TrustSection — não renderizar em Cat A (usa LocalTestimonials — INT-027) */}
        {content.trust && !isA && (
          <TrustSection
            headline={content.trust.headline}
            stats={content.trust.stats}
            testimonials={content.trust.testimonials}
          />
        )}

        {/* WaitlistForm — apenas Cat. E (INT-015) */}
        {isE && (
          <section
            id="lista-de-espera"
            aria-label="Lista de Espera"
            className="py-16 px-4"
          >
            <div className="max-w-lg mx-auto">
              <WaitlistForm
                slug={config.slug}
                endpoint={config.waitlist?.endpoint}
                productName={config.name}
                waitlistCount={config.waitlist?.count}
                earlyBirdDiscount={config.waitlist?.earlyBirdDiscount}
                whatsappNumber={config.cta.whatsappNumber}
              />
            </div>
          </section>
        )}

        {/* ADS-15 — slot inArticle entre FeatureGrid/HowItWorks/Trust e FAQ.
            Categoria E (waitlist) tem o ad bloqueado por canShowAds (rota / é allowed,
            mas page é landing tipo waitlist — AdSlot retorna null se config nao tiver
            slot inArticle ou se modo `off`). */}
        <AdSlot config={config} pathname="/" slot="inArticle" />

        {hasFaqs && (
          <FAQAccordion
            headline={content.faqs!.headline}
            faqs={content.faqs!.items}
          />
        )}

        {/* Cat. E não tem CTA de contato — usa WaitlistForm acima */}
        {!isE && (
          <CTASection
            headline={content.cta?.headline}
            subheadline={content.cta?.subheadline}
            ctaLabel={config.cta.primaryLabel}
            ctaHref="/contato"
            whatsappNumber={config.cta.whatsappNumber}
            whatsappMessage={config.cta.whatsappMessage}
          />
        )}

        {/* ADS-15 — slot footer (acima do <Footer> global) */}
        <AdSlot config={config} pathname="/" slot="footer" />
      </main>

      <Footer
        siteName={config.name}
        showSystemForgeLogo={config.showSystemForgeLogo}
        links={config.footerLinks}
        contactEmail={(config as { contactEmail?: string }).contactEmail}
      />

      <WhatsAppButton
        phone={config.cta.whatsappNumber}
        message={config.cta.whatsappMessage}
      />

      {/* ExitIntentPopup — apenas Cat. D (INT-038) */}
      {isD && (
        <ExitIntentPopup
          slug={config.slug}
          offerText={config.exitIntent?.offerText ?? 'Espere! Temos algo importante para você'}
          offerSubtext={config.exitIntent?.offerSubtext}
          ctaLabel={config.exitIntent?.ctaLabel ?? 'Resolver Meu Problema'}
          ctaHref={config.exitIntent?.ctaHref ?? '#contato'}
          triggerOnce
        />
      )}
    </div>
  );
}
