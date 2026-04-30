'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { readConsent, writeConsent, type ConsentState } from '@/lib/cookie-consent';
import { captureConsentProof } from '@/lib/consent-proof';
import { applyAdvertisingRevocationSideEffects } from '@/lib/adsense-revoke';

// CL-355 — consentimento granular: essenciais sempre ON, analytics opt-in, publicidade opt-in (ADS-03/05).
// CL-252 — retencao 12m + version + consentedAt.
// ADS-05 — 3 categorias com paridade visual (anti-dark-pattern ANPD):
//   - "Aceitar todos" e "Apenas essenciais" tem mesmo peso visual.
//   - Sem pre-selecao de toggles alem do essencial.
//   - "Personalizar" expande inline (sem segunda janela).
//   - Sem cookie wall: rejeitar nao bloqueia conteudo.
// ADS-46 — toda decisao gera prova de consentimento auditavel via captureConsentProof.

type Phase = 'unknown' | 'banner' | 'customize' | 'resolved';

interface Props {
  /** Slug do site para rastreabilidade da prova de consent. Default `unknown` em SSR. */
  siteSlug?: string;
}

export function CookieConsent({ siteSlug = 'unknown' }: Props) {
  const [phase, setPhase] = useState<Phase>('unknown');
  const [analyticsToggle, setAnalyticsToggle] = useState(false);
  const [advertisingToggle, setAdvertisingToggle] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setPhase(stored ? 'resolved' : 'banner');
  }, []);

  function broadcastAndPersist(
    state: { analytics: boolean; advertising: boolean },
    origin: 'banner' | 'manage_modal' | 'banner_default_essential',
  ) {
    // ADS-39: detecta transicao advertising:true -> false ANTES de regravar
    // para invocar pauseAdRequests + gtag denied + cookie cleanup.
    const previous = readConsent();
    const wasAdvertising = previous?.advertising === true;

    const enriched: ConsentState = writeConsent(state);
    // ADS-46: captura prova auditavel async, sem bloquear UX.
    void captureConsentProof(enriched, origin, siteSlug);

    if (wasAdvertising && !state.advertising) {
      // ADS-39: pausa requests + gtag denied + cookie cleanup, sem regravar
      // storage (writeConsent ja foi chamado) nem duplicar evento.
      applyAdvertisingRevocationSideEffects();
    }

    // Evento global consumido por GA4Loader, AdSenseLoader, AdBanner via useAdConsent.
    window.dispatchEvent(new CustomEvent('cookie_consent', { detail: enriched }));
  }

  function handleAcceptAll() {
    broadcastAndPersist({ analytics: true, advertising: true }, 'banner');
    setPhase('resolved');
  }

  function handleOnlyEssential() {
    broadcastAndPersist(
      { analytics: false, advertising: false },
      phase === 'customize' ? 'manage_modal' : 'banner_default_essential',
    );
    setPhase('resolved');
  }

  function handleCustomize() {
    setPhase('customize');
  }

  function handleSaveCustom() {
    broadcastAndPersist(
      { analytics: analyticsToggle, advertising: advertisingToggle },
      'manage_modal',
    );
    setPhase('resolved');
  }

  if (phase === 'unknown' || phase === 'resolved') return null;

  // Estilo compartilhado entre "Aceitar" e "Apenas essenciais" — paridade visual exigida ADS-05.
  const primaryButtonStyle = {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  } as const;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      aria-describedby="cookie-desc"
      data-testid="cookie-consent-banner"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t shadow-xl bg-white',
        'p-4 sm:p-6',
      )}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-4">
        <p
          id="cookie-desc"
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Usamos cookies essenciais para o funcionamento do site e, mediante seu consentimento,
          cookies de analise (Google Analytics) e de publicidade (Google AdSense). Voce pode
          aceitar, recusar ou personalizar a qualquer momento. Veja a{' '}
          <Link
            href="/privacidade"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            Politica de Privacidade
          </Link>{' '}
          e os{' '}
          <Link
            href="/termos"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            Termos de Uso
          </Link>
          .
        </p>

        {phase === 'customize' && (
          <fieldset
            data-testid="cookie-consent-customize"
            className="border rounded-lg p-3 text-sm"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <legend
              className="px-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Preferencias
            </legend>

            {/* Categoria 1 — Essenciais (sempre on) */}
            <div className="flex items-start justify-between gap-3 py-2">
              <div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Essenciais
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Necessarios para o funcionamento basico (sessao, preferencias, seguranca). Nao
                  podem ser desabilitados.
                </div>
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-muted, #F3F4F6)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Sempre ativo
              </span>
            </div>

            {/* Categoria 2 — Analise */}
            <div
              className="flex items-start justify-between gap-3 py-2 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Analise (Google Analytics 4)
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Medicoes anonimas de audiencia e desempenho do site. Dados processados pelo
                  Google LLC nos Estados Unidos.
                </div>
              </div>
              <ToggleSwitch
                testId="cookie-consent-analytics-toggle"
                label="Habilitar cookies de analise"
                checked={analyticsToggle}
                onChange={setAnalyticsToggle}
              />
            </div>

            {/* Categoria 3 — Publicidade (ADS-05) */}
            <div
              className="flex items-start justify-between gap-3 py-2 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Publicidade (Google AdSense)
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Permite exibir anuncios contextuais e medir impressoes/cliques. Cookies como{' '}
                  <code>__gads</code>, <code>__gpi</code>, <code>NID</code> sao gravados no seu
                  navegador. Parceiro: Google LLC (Estados Unidos). Voce pode revogar a qualquer
                  momento na pagina{' '}
                  <Link
                    href="/cookies"
                    className="underline underline-offset-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    /cookies
                  </Link>
                  .
                </div>
              </div>
              <ToggleSwitch
                testId="cookie-consent-advertising-toggle"
                label="Habilitar cookies de publicidade"
                checked={advertisingToggle}
                onChange={setAdvertisingToggle}
              />
            </div>
          </fieldset>
        )}

        {/* Botoes — paridade visual entre Aceitar e Apenas essenciais (ADS-05 anti-dark-pattern) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end">
          <button
            data-testid="cookie-consent-reject-button"
            onClick={handleOnlyEssential}
            className="px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-opacity duration-150 hover:opacity-90"
            style={primaryButtonStyle}
          >
            Apenas essenciais
          </button>
          {phase === 'banner' ? (
            <button
              data-testid="cookie-consent-customize-button"
              onClick={handleCustomize}
              className="px-4 py-2 min-h-[44px] rounded-lg border text-sm font-medium transition-colors duration-150 hover:bg-gray-50"
              style={{ borderColor: '#D1D5DB', color: 'var(--color-text-primary)' }}
            >
              Personalizar
            </button>
          ) : (
            <button
              data-testid="cookie-consent-save-button"
              onClick={handleSaveCustom}
              className="px-4 py-2 min-h-[44px] rounded-lg border text-sm font-medium transition-colors duration-150 hover:bg-gray-50"
              style={{ borderColor: '#D1D5DB', color: 'var(--color-text-primary)' }}
            >
              Salvar preferencias
            </button>
          )}
          <button
            data-testid="cookie-consent-accept-button"
            onClick={handleAcceptAll}
            className="px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-opacity duration-150 hover:opacity-90"
            style={primaryButtonStyle}
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToggleProps {
  testId: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleSwitch({ testId, label, checked, onChange }: ToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
      <input
        data-testid={testId}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span
        className="w-11 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-offset-1"
        style={{ backgroundColor: checked ? 'var(--color-accent)' : '#D1D5DB' }}
      />
      <span
        className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </label>
  );
}
