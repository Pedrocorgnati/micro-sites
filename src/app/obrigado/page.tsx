import type { Metadata } from 'next';
import Link from 'next/link';
import { loadSiteConfig, getAccentStyle, buildWhatsAppUrl } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export const metadata: Metadata = {
  title: 'Mensagem recebida!',
  robots: { index: false, follow: false },
};

export default function ObrigadoPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);
  const waUrl = buildWhatsAppUrl(config.cta.whatsappNumber, config.cta.whatsappMessage);

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-col items-center justify-center px-4 py-24 min-h-[60vh] text-center"
      >
        {/* Check icon */}
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: '#D1FAE5' }}
          aria-hidden="true"
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          Mensagem recebida!
        </h1>

        <p
          className="text-base max-w-md mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Obrigado pelo contato. Nossa equipe analisará sua mensagem e retornará em até 24 horas
          úteis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
            style={{ backgroundColor: '#25D366' }}
          >
            Falar agora no WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm border-2 transition-all duration-150 active:scale-95"
            style={{
              color: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
            }}
          >
            Voltar ao Início
          </Link>
        </div>
      </main>

      <Footer siteName={config.name} showSystemForgeLogo={config.showSystemForgeLogo} links={config.footerLinks} />
    </div>
  );
}
