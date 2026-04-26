import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WaitlistForm } from '@/components/forms/WaitlistForm';
import { NoscriptFallback } from '@/components/sections/NoscriptFallback';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export async function generateMetadata(): Promise<Metadata> {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: `Lista de Espera | ${config.name}`,
    description: `Garanta sua vaga antecipada em ${config.name}. Primeiros inscritos têm condições exclusivas.`,
  };
}

export default function ListaDeEsperaPage() {
  const config = loadSiteConfig(SITE_SLUG);

  if (config.category !== 'E') {
    redirect('/');
  }

  const accentStyle = getAccentStyle(config);

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
        <div className="max-w-[1200px] mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Início', href: '/' },
              { label: 'Lista de Espera' },
            ]}
            className="mb-6"
          />

          <div className="max-w-lg mx-auto">
            <h1
              className="text-2xl md:text-3xl font-bold mb-2 text-center"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
            >
              Entre na lista de espera
            </h1>
            <p className="mb-10 text-base text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Seja um dos primeiros a ter acesso a {config.name} e garanta condições exclusivas de early bird.
            </p>

            <NoscriptFallback
              whatsappNumber={config.cta.whatsappNumber}
              message={config.cta.whatsappMessage}
              contactEmail={(config as { contactEmail?: string }).contactEmail}
              variant="contact"
            />

            <WaitlistForm
              slug={config.slug}
              endpoint={(config as { waitlist?: { endpoint?: string } }).waitlist?.endpoint}
              productName={config.name}
              waitlistCount={(config as { waitlist?: { count?: number } }).waitlist?.count}
              earlyBirdDiscount={(config as { waitlist?: { earlyBirdDiscount?: string } }).waitlist?.earlyBirdDiscount}
              whatsappNumber={config.cta.whatsappNumber}
            />
          </div>
        </div>
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} contactEmail={(config as { contactEmail?: string }).contactEmail} />
      <WhatsAppButton phone={config.cta.whatsappNumber} message={config.cta.whatsappMessage} />
    </div>
  );
}
