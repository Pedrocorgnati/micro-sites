// /simulador — rota canonica D05 (CL-364)
// Para sites nao-D05, redireciona para home via redirect('/').
// Em static export usamos `force-static` + render condicional + meta-refresh fallback
// porque next/navigation `redirect` nao funciona em static export. Em D05 renderiza
// D05Checklist. Em outras categorias, gera HTML que faz client-side redirect imediato.
import type { Metadata } from 'next';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { D05Checklist } from '@/components/sections/D05Checklist';
import { NoscriptFallback } from '@/components/sections/NoscriptFallback';
import { AdSlot } from '@/components/ads/AdSlot';
import { buildBreadcrumbList } from '@/lib/schema-markup';
import { buildNextMetadata } from '@/lib/seo-helpers';

export const dynamic = 'force-static';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export function generateMetadata(): Metadata {
  const config = loadSiteConfig(SITE_SLUG);
  const isD05 = SITE_SLUG.startsWith('d05');
  if (!isD05) {
    return {
      title: 'Simulador',
      robots: { index: false, follow: false },
    };
  }
  return buildNextMetadata(
    {
      ...config,
      seo: {
        ...config.seo,
        title: 'Simulador de Presenca Digital — Checklist Gratuito',
        description: 'Avalie em 5 minutos se sua empresa esta pronta para o digital. Checklist guiado com pontuacao e acoes prioritarias.',
      },
    } as typeof config,
    config.seo.canonical ?? '',
    '/simulador',
  );
}

export default function SimuladorPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);
  const isD05 = SITE_SLUG.startsWith('d05');

  // Sites nao-D05: render redirect HTML (static export friendly)
  if (!isD05) {
    return (
      <html lang="pt-BR">
        <head>
          <meta httpEquiv="refresh" content="0; url=/" />
          <title>Redirecionando...</title>
        </head>
        <body>
          <p>
            Esta rota e exclusiva do site <strong>D05 — Checklist de Presenca Digital</strong>.
            <a href="/">Voltar para o inicio</a>
          </p>
          <script
            dangerouslySetInnerHTML={{
              __html: 'window.location.replace("/");',
            }}
          />
        </body>
      </html>
    );
  }

  const breadcrumbBase = config.seo.canonical ?? '';
  const breadcrumbSchema = buildBreadcrumbList(breadcrumbBase, [
    { name: 'Inicio', url: '/' },
    { name: 'Simulador', url: '/simulador' },
  ]);

  return (
    <div style={accentStyle}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-white"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        Pular para o conteudo
      </a>

      <Header
        siteName={config.name}
        navLinks={[
          { label: 'Inicio', href: '/' },
          { label: 'Contato', href: '/contato' },
        ]}
        ctaLabel={config.cta.primaryLabel}
        ctaHref="/contato"
      />

      <script
        id="schema-breadcrumbs-simulador"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        <div className="max-w-[1200px] mx-auto px-4 pt-6">
          <NoscriptFallback
            whatsappNumber={config.cta.whatsappNumber}
            message={config.cta.whatsappMessage}
            variant="calculator"
          />
        </div>

        <header className="max-w-[900px] mx-auto px-4 pt-6 pb-2">
          <nav aria-label="Breadcrumb" className="text-xs">
            <ol className="flex gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li><a href="/" className="underline">Inicio</a></li>
              <li aria-hidden="true">›</li>
              <li aria-current="page">Simulador</li>
            </ol>
          </nav>
        </header>

        <D05Checklist config={config} />

        {/* CTA pos-resultado */}
        <section
          aria-label="Proximos passos"
          className="py-12 px-4"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Quer um plano de acao customizado?
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              Compartilhe seu e-mail e enviamos o checklist completo + recomendacoes priorizadas.
            </p>
            <a
              href="/contato"
              data-testid="simulador-cta-email"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm min-h-[44px]"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent, #fff)' }}
            >
              Receber por e-mail →
            </a>
          </div>
        </section>

        {/* ADS-17 — slot footer (opt-in via config.adsense.routesAllowed = ['simulador']) */}
        <AdSlot config={config} pathname="/simulador" slot="footer" />
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
