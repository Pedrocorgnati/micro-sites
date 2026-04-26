import type { Metadata } from 'next';
import { loadSiteConfig, getAccentStyle } from '@/lib/config-loader';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { CookiesTable } from '@/components/lgpd/CookiesTable';
import { RevocationGuide } from '@/components/lgpd/RevocationGuide';
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy-version';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export const dynamic = 'force-static';

export function generateMetadata(): Metadata {
  const config = loadSiteConfig(SITE_SLUG);
  return {
    title: 'Politica de Cookies',
    description: `Lista detalhada de cookies utilizados em ${config.name}, finalidade, retencao e como revogar consentimento. Conforme LGPD.`,
    alternates: { canonical: '/cookies' },
  };
}

export default function CookiesPage() {
  const config = loadSiteConfig(SITE_SLUG);
  const accentStyle = getAccentStyle(config);
  const controllerContact =
    (config as { contactEmail?: string }).contactEmail ?? 'privacidade@systemforge.com.br';

  return (
    <div style={accentStyle}>
      <Header siteName={config.name} ctaLabel={config.cta.primaryLabel} ctaHref="/contato" />

      <main
        id="main-content"
        data-testid="main-content"
        tabIndex={-1}
        className="max-w-[1200px] mx-auto px-4 py-12"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <div className="max-w-[768px] mx-auto prose">
          <h1>Politica de Cookies — {config.name}</h1>

          <p>
            Esta pagina detalha quais cookies (e armazenamentos similares como{' '}
            <code>localStorage</code>) sao utilizados em <strong>{config.name}</strong>,
            sua finalidade, retencao e tratamento conforme a LGPD.
          </p>

          <p>
            Para visao consolidada das bases legais e dos seus direitos como titular,
            consulte tambem nossa <a href="/privacidade">Politica de Privacidade</a>{' '}
            e os <a href="/termos">Termos de Uso</a>.
          </p>

          <h2>Tabela de cookies</h2>
          <CookiesTable />

          <h2>Retencao do consentimento</h2>
          <p>
            Sua escolha de consentimento e armazenada por <strong>12 meses</strong> em{' '}
            <code>localStorage</code>. Apos esse prazo, solicitamos consentimento novamente.
          </p>
          <p>
            Caso a versao da Politica de Privacidade seja atualizada (mudanca material de copy,
            base legal ou nova categoria de dados), o banner reabre antes mesmo dos 12 meses.
            Versao atual: <code>{PRIVACY_POLICY_VERSION}</code>.
          </p>

          <RevocationGuide controllerContact={controllerContact} />

          <h2>Cookies de terceiros</h2>
          <p>
            Apos seu consentimento explicito, carregamos Google Analytics 4 (GA4) para metrificar
            audiencia de forma agregada e anonimizada. O GA4 utiliza os cookies <code>_ga</code>{' '}
            e <code>_gid</code> conforme tabela acima. Sem consentimento, esses cookies nao sao definidos.
          </p>
          <p>
            Politica do Google:{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              policies.google.com/privacy
            </a>
            .
          </p>

          <h2>Contato LGPD</h2>
          <p>
            Para qualquer duvida, exercicio de direitos ou revogacao formal, escreva para{' '}
            <a href={`mailto:${controllerContact}?subject=%5BLGPD%5D%20Cookies`}>{controllerContact}</a>{' '}
            com o assunto <code>[LGPD]</code>.
          </p>

          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2rem' }}>
            Versao da Politica de Privacidade: <code>{PRIVACY_POLICY_VERSION}</code>
          </p>
        </div>
      </main>

      <Footer
        siteName={config.name}
        showSystemForgeLogo={config.showSystemForgeLogo}
        links={config.footerLinks}
        contactEmail={(config as { contactEmail?: string }).contactEmail}
      />
    </div>
  );
}
