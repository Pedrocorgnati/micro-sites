'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PRIVACY_POLICY_VERSION, isConsentExpired, isConsentVersionStale } from '@/lib/privacy-version';

// CL-355 — consentimento granular: essenciais sempre ON, analytics opt-in.
// CL-252 — retencao 12m + version + consentedAt.
// Formato atualizado do storage:
//   localStorage['cookie_consent']    = JSON { essential: true, analytics: boolean, version: string, consentedAt: string }
//   localStorage['cookie_consent_at'] = ISO timestamp (legado, mantido para retrocompat)
// Retrocompat: strings 'accepted' / 'rejected' ainda sao aceitas na leitura.

export interface CookieConsentState {
  essential: true;
  analytics: boolean;
  version?: string;
  consentedAt?: string;
}

const STORAGE_KEY = 'cookie_consent';
const TIMESTAMP_KEY = 'cookie_consent_at';

type Phase = 'unknown' | 'banner' | 'customize' | 'resolved';

function readStoredConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Retrocompat: versao antiga guardava apenas 'accepted' ou 'rejected'
    if (raw === 'accepted') return { essential: true, analytics: true };
    if (raw === 'rejected') return { essential: true, analytics: false };
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed && typeof parsed === 'object' && typeof parsed.analytics === 'boolean') {
      // CL-252: invalida consent expirado (>12m) ou de versao antiga
      if (isConsentExpired(parsed.consentedAt) || isConsentVersionStale(parsed.version)) {
        return null;
      }
      return {
        essential: true,
        analytics: parsed.analytics,
        version: parsed.version,
        consentedAt: parsed.consentedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function persistConsent(state: Pick<CookieConsentState, 'essential' | 'analytics'>) {
  const enriched: CookieConsentState = {
    essential: true,
    analytics: state.analytics,
    version: PRIVACY_POLICY_VERSION,
    consentedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
    localStorage.setItem(TIMESTAMP_KEY, enriched.consentedAt!);
  } catch {
    // localStorage indisponivel (modo privado) — silent
  }
  // Evento global consumido por GA4Loader.
  // detail.analytics === true => carregar GA. false => nao carregar.
  window.dispatchEvent(new CustomEvent('cookie_consent', { detail: enriched }));
}

export function CookieConsent() {
  const [phase, setPhase] = useState<Phase>('unknown');
  const [analyticsToggle, setAnalyticsToggle] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setPhase('resolved');
    } else {
      setPhase('banner');
    }
  }, []);

  function handleAcceptAll() {
    persistConsent({ essential: true, analytics: true });
    setPhase('resolved');
  }

  function handleOnlyEssential() {
    persistConsent({ essential: true, analytics: false });
    setPhase('resolved');
  }

  function handleCustomize() {
    setPhase('customize');
  }

  function handleSaveCustom() {
    persistConsent({ essential: true, analytics: analyticsToggle });
    setPhase('resolved');
  }

  if (phase === 'unknown' || phase === 'resolved') return null;

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
          Usamos cookies essenciais para funcionamento do site e, mediante seu consentimento, cookies de
          analise para medir audiencia. Veja a{' '}
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
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Preferencias
            </legend>
            <div className="flex items-start justify-between gap-3 py-2">
              <div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Essenciais
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Necessarios para o funcionamento basico. Nao podem ser desabilitados.
                </div>
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ backgroundColor: 'var(--color-muted, #F3F4F6)', color: 'var(--color-text-muted)' }}
              >
                Sempre ativo
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 py-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Analise (Google Analytics 4)
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Medicoes anonimas de audiencia e desempenho do site.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
                <input
                  data-testid="cookie-consent-analytics-toggle"
                  type="checkbox"
                  className="sr-only peer"
                  checked={analyticsToggle}
                  onChange={(e) => setAnalyticsToggle(e.target.checked)}
                  aria-label="Habilitar cookies de analise"
                />
                <span
                  className="w-11 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-offset-1"
                  style={{
                    backgroundColor: analyticsToggle ? 'var(--color-accent)' : '#D1D5DB',
                  }}
                />
                <span
                  className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: analyticsToggle ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </label>
            </div>
          </fieldset>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end">
          <button
            data-testid="cookie-consent-reject-button"
            onClick={handleOnlyEssential}
            className="px-4 py-2 min-h-[44px] rounded-lg border text-sm font-medium transition-colors duration-150 hover:bg-gray-50"
            style={{ borderColor: '#D1D5DB', color: 'var(--color-text-primary)' }}
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
            className="px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
            }}
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
