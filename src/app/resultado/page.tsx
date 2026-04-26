import type { Metadata } from 'next';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { FullResult } from '@/components/sections/FullResult';
import { D05Checklist } from '@/components/sections/D05Checklist';
import { F01Comparator } from '@/components/sections/F01Comparator';
import { NoscriptFallback } from '@/components/sections/NoscriptFallback';
import { PrintButton } from '@/components/ui/PrintButton';
import { buildBreadcrumbList } from '@/lib/schema-markup';
import fs from 'node:fs';
import path from 'node:path';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export const metadata: Metadata = {
  title: 'Seu Resultado',
  robots: { index: false, follow: false },
};

function pdfPathForSite(slug: string, leadMagnetEnabled: boolean | undefined): string | undefined {
  if (!leadMagnetEnabled) return undefined;
  const templatePath = path.join(process.cwd(), 'sites', slug, 'content', 'pdf-template.json');
  if (!fs.existsSync(templatePath)) return undefined;
  const generatedPdf = path.join(process.cwd(), 'public', 'relatorio.pdf');
  if (!fs.existsSync(generatedPdf)) return undefined;
  return '/relatorio.pdf';
}

export default function ResultadoPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);
  const pdfPath = pdfPathForSite(SITE_SLUG, config.leadMagnet?.enabled);

  const breadcrumbBase = config.seo.canonical ?? '';
  const breadcrumbSchema = buildBreadcrumbList(breadcrumbBase, [
    { name: 'Inicio', url: '/' },
    { name: 'Calculadora', url: '/' },
    { name: 'Resultado', url: '/resultado' },
  ]);

  return (
    <div style={accentStyle}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-white"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        Pular para o conteúdo
      </a>

      <Header
        siteName={config.name}
        navLinks={[
          { label: 'Início', href: '/' },
          { label: 'Contato', href: '/contato' },
        ]}
        ctaLabel={config.cta.primaryLabel}
        ctaHref="/contato"
      />

      <script
        id="schema-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main id="main-content" data-testid="main-content" tabIndex={-1}>
        <div className="print-hidden max-w-[1200px] mx-auto px-4 pt-6">
          <NoscriptFallback
            whatsappNumber={config.cta.whatsappNumber}
            message={config.cta.whatsappMessage}
            contactEmail={(config as { contactEmail?: string }).contactEmail}
            variant="calculator"
          />
        </div>

        <div className="print-hidden max-w-[1200px] mx-auto px-4 pt-6 flex flex-col sm:flex-row justify-end gap-3">
          {/* TASK-28 ST002 / CL-193 — refazer calculo preservando inputs via querystring */}
          <a
            href="/quanto-custa?prefill=1"
            data-testid="resultado-refazer-link"
            className="px-4 py-2 min-h-[44px] rounded-lg border text-sm font-medium inline-flex items-center justify-center transition-colors duration-150 hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Refazer calculo
          </a>
          <PrintButton />
        </div>

        {SITE_SLUG.startsWith('d05') ? (
          <D05Checklist config={config} />
        ) : SITE_SLUG.startsWith('f01') ? (
          <F01Comparator config={config} />
        ) : (
          <FullResult config={config} pdfPath={pdfPath} />
        )}

        {/* Próximos Passos — cross-links contextuais para Cat. D (module-12) */}
        {config.crossLinks && config.crossLinks.filter((cl) => cl.context === 'resultado').length > 0 && (
          <section
            data-testid="next-steps-section"
            aria-label="Próximos passos"
            className="py-12 bg-slate-50"
          >
            <div className="max-w-[1200px] mx-auto px-4">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                Próximos Passos
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                {config.crossLinks
                  .filter((cl) => cl.context === 'resultado')
                  .map((cl) => (
                    <a
                      key={cl.href}
                      href={cl.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 rounded-lg border font-semibold text-sm transition-all duration-150 hover:opacity-80"
                      style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                    >
                      {cl.anchor}
                    </a>
                  ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer
        siteName={config.name}
        showSystemForgeLogo={config.showSystemForgeLogo}
        links={config.footerLinks}
        crossLinks={config.crossLinks}
      />

      <WhatsAppButton
        phone={config.cta.whatsappNumber}
        message={config.cta.whatsappMessage}
      />
    </div>
  );
}
