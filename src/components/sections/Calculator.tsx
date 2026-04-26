'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SiteConfig, CalculatorInput, CalculatorType } from '@/types';
import { STORAGE_KEYS, TIMING } from '@/types';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatResult } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { captureCalculatorError, setSentryContextTags } from '@/lib/sentry-helpers';
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy-version';
import { recordFailure, recordSuccess, shouldSkipRequest } from '@/lib/circuit-breaker';
import { getFormEndpoint } from '@/lib/constants';
import { ProgressBanner } from './ProgressBanner';
import { NoscriptFallback } from './NoscriptFallback';

interface CalculatorProps {
  inputs: CalculatorInput[];
  config: SiteConfig;
  partialResultThreshold?: number;
  type?: CalculatorType;
  headline?: string;
  subheadline?: string;
}

type Answers = Record<string, string>;

function calcTotal(inputs: CalculatorInput[], answers: Answers): number {
  return inputs.reduce((sum, input) => {
    const answer = answers[input.id];
    if (!answer) return sum;
    const option = input.options?.find((o) => o.value === answer);
    const points = option?.points ?? 0;
    const weight = input.weight ?? 1;
    return sum + points * weight;
  }, 0);
}

export function Calculator({
  inputs,
  config,
  partialResultThreshold = 3,
  type = 'calculator',
  headline = 'Calcule agora',
  subheadline,
}: CalculatorProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startedTrackedRef = useRef(false);

  function scoreBand(total: number): 'low' | 'mid' | 'high' {
    if (total < 30) return 'low';
    if (total < 70) return 'mid';
    return 'high';
  }

  function trackStartedOnce() {
    if (startedTrackedRef.current) return;
    startedTrackedRef.current = true;
    trackEvent('calculator_started', { site: config.slug, category: config.category, type });
    // CL-322: canonical GA4 event name alinhado ao INTAKE-CHECKLIST.
    trackEvent('calculator_start', { calculator_id: config.slug });
  }

  const currentInput = inputs[step];
  const answeredCount = Object.keys(answers).length;
  const hasPartialResult = answeredCount >= partialResultThreshold;
  let partialTotal = 0;
  try {
    partialTotal = calcTotal(inputs, answers);
  } catch (err) {
    captureCalculatorError(err, { slug: config.slug, step, type });
  }

  useEffect(() => {
    setSentryContextTags({
      site_slug: config.slug,
      category: config.category ?? 'unknown',
      calc_type: type,
    });
  }, [config.slug, config.category, type]);

  const storageKey = STORAGE_KEYS.calculatorProgress(config.slug);

  const saveProgress = useCallback((newAnswers: Answers, newStep: number) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers: newAnswers, step: newStep, ts: Date.now() }));
    } catch {
      // localStorage não disponível
    }
  }, [storageKey]);

  const clearProgress = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* noop */ }
  }, [storageKey]);

  function handleSelect(value: string) {
    trackStartedOnce();
    const newAnswers = { ...answers, [currentInput.id]: value };
    setAnswers(newAnswers);
    saveProgress(newAnswers, step);

    if (step + 1 >= inputs.length) {
      setShowEmailCapture(true);
    }
  }

  function handleNext() {
    if (!answers[currentInput.id]) return;
    const nextStep = step + 1;
    if (nextStep >= inputs.length) {
      setShowEmailCapture(true);
      return;
    }
    // CL-365: micro-loading transicional entre etapas.
    // prefers-reduced-motion: aplica transicao instantanea.
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const advance = (): void => {
      setStep(nextStep);
      saveProgress(answers, nextStep);
      if (answeredCount + 1 >= partialResultThreshold) {
        setShowEmailCapture(false);
      }
      setIsTransitioning(false);
    };
    if (reducedMotion) {
      advance();
      return;
    }
    setIsTransitioning(true);
    window.setTimeout(advance, 200);
  }

  function handlePrev() {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      setShowEmailCapture(false);
    }
  }

  function handleRetomar(saved: { answers: Answers; step: number }) {
    setAnswers(saved.answers);
    setStep(saved.step);
  }

  function handleComecarDoZero() {
    setAnswers({});
    setStep(0);
    setShowEmailCapture(false);
    clearProgress();
  }

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('E-mail inválido');
      return;
    }
    setEmailError('');
    setNetworkError('');
    setIsSubmitting(true);

    try {
      // CL-496: circuit breaker — pula fetch se aberto
      if (config.cta.formEndpoint && shouldSkipRequest('static-forms')) {
        // Continua o fluxo (mostra resultado + WA fallback) sem tentar SF
      } else
      // Static Forms — lead capture
      if (config.cta.formEndpoint) {
        // TASK-7 / CL-013: marcar origem D03/D04 no payload para roteamento
        // de nurture (email alert <15min + WhatsApp D+5).
        const nurturePriorityTag = config.slug?.startsWith('d03')
          ? 'D03'
          : config.slug?.startsWith('d04')
          ? 'D04'
          : undefined;
        // TASK-20 ST002: resolve via getFormEndpoint preservando override do config
        const calcEndpoint = getFormEndpoint('calc', { slug: config.slug, siteOverride: config.cta.formEndpoint });
        const res = await fetch(calcEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            site: config.slug,
            source: config.slug,
            calculator_type: type,
            nurture_priority_tag: nurturePriorityTag,
            resultado: partialTotal,
            tipo: type,
            // CL-242: log versao da PrivacyPolicy aceita
            privacy_version: PRIVACY_POLICY_VERSION,
            accessKey: config.cta.formAccessKey ?? '',
          }),
        });
        if (!res.ok) throw new Error('form-submit-failed');
        recordSuccess('static-forms');
      }

      // GA4 event
      if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'calculator_lead_captured', {
          site_slug: config.slug,
          total: partialTotal,
        });
      }

      trackEvent('calculator_completed', {
        site: config.slug,
        category: config.category,
        type,
        scoreBand: scoreBand(partialTotal),
      });

      // Salvar resultado no sessionStorage para /resultado
      const resultData = { inputs, answers, total: partialTotal, email, type };
      sessionStorage.setItem('calc-full-result', JSON.stringify(resultData));

      // Limpar localStorage (LGPD)
      clearProgress();

      router.push('/resultado');
    } catch (err) {
      // CL-496: registrar falha no circuit breaker
      recordFailure('static-forms');
      captureCalculatorError(err, { slug: config.slug, step, type });
      setNetworkError('Erro ao enviar. Tente pelo WhatsApp.');
      setIsSubmitting(false);
    }
  }

  const progressPercent = inputs.length > 0 ? Math.round(((step + (answers[currentInput?.id] ? 1 : 0)) / inputs.length) * 100) : 0;
  const waUrl = buildWhatsAppUrl(config.cta.whatsappNumber, config.cta.whatsappMessage);

  const labelMap: Record<string, string> = {
    calculator: 'orçamento estimado',
    diagnostic: 'pontuação de diagnóstico',
    checklist: '% de completude',
  };

  return (
    <section
      id="calculator"
      data-testid="calculator-section"
      aria-label="Calculadora interativa"
      className="py-16"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Headline */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            {headline}
          </h2>
          {subheadline && (
            <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
              {subheadline}
            </p>
          )}
        </div>

        {/* Progress Banner (localStorage) */}
        <div className="max-w-xl mx-auto">
          <ProgressBanner
            slug={config.slug}
            onRetomar={handleRetomar}
            onComecarDoZero={handleComecarDoZero}
          />
        </div>

        {/* Noscript Fallback */}
        <div className="max-w-xl mx-auto">
          <NoscriptFallback whatsappNumber={config.cta.whatsappNumber} />
        </div>

        {/* Main Card */}
        <div
          className="max-w-xl mx-auto rounded-xl border p-6 md:p-8"
          style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-md)' }}
        >
          {!showEmailCapture ? (
            <div
              aria-busy={isTransitioning}
              style={{ opacity: isTransitioning ? 0.55 : 1, transition: 'opacity 150ms ease' }}
            >
              {isTransitioning && (
                <div
                  role="status"
                  aria-live="polite"
                  data-testid="calculator-transitioning"
                  className="sr-only"
                >
                  Carregando proxima pergunta
                </div>
              )}
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Pergunta {step + 1} de {inputs.length}</span>
                  <span>{progressPercent}% concluído</span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%`, backgroundColor: 'var(--color-accent)' }}
                  />
                </div>
              </div>

              {/* Pergunta */}
              {currentInput && (
                <fieldset className="mb-6">
                  <legend
                    className="text-base md:text-lg font-semibold mb-4 w-full"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
                  >
                    {currentInput.label}
                  </legend>

                  <div className="flex flex-col gap-3">
                    {currentInput.options?.map((option) => {
                      const isSelected = answers[currentInput.id] === option.value;
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-150 min-h-[44px]"
                          style={{
                            borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                            backgroundColor: isSelected ? 'color-mix(in srgb, var(--color-accent) 8%, white)' : 'transparent',
                          }}
                        >
                          <input
                            type="radio"
                            name={currentInput.id}
                            value={option.value}
                            checked={isSelected}
                            onChange={() => handleSelect(option.value)}
                            className="sr-only"
                            aria-label={option.label}
                          />
                          <span
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                            style={{ borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)' }}
                            aria-hidden="true"
                          >
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                            )}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Partial Result Preview */}
              {hasPartialResult && partialTotal > 0 && (
                <div
                  className="mb-6 p-4 rounded-lg text-center"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 6%, white)', borderColor: 'var(--color-accent)', border: '1px solid' }}
                >
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Estimativa parcial ({labelMap[type]}):
                  </p>
                  <p className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}>
                    {formatResult(partialTotal, type)}
                  </p>
                </div>
              )}

              {/* Navegação */}
              <div className="flex gap-3 justify-between">
                <button
                  type="button"
                  data-testid="calculator-prev-button"
                  onClick={handlePrev}
                  disabled={step === 0}
                  className="px-5 py-2.5 rounded-lg border text-sm font-medium min-h-[44px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  data-testid="calculator-next-button"
                  onClick={handleNext}
                  disabled={!answers[currentInput?.id] || isTransitioning}
                  className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold text-white min-h-[44px] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {step + 1 >= inputs.length ? 'Ver resultado →' : 'Próxima →'}
                </button>
              </div>
            </div>
          ) : (
            /* Email Capture */
            <div data-testid="email-capture">
              {/* Partial Result */}
              <div className="text-center mb-6">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Seu resultado estimado
                </p>
                <p className="text-3xl font-extrabold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}>
                  {formatResult(partialTotal, type)}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Para ver o resultado completo, informe seu e-mail:
                </p>
              </div>

              <form onSubmit={handleSubmitEmail} noValidate className="flex flex-col gap-4">
                <div>
                  <label htmlFor="calc-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    Seu e-mail *
                  </label>
                  <input
                    id="calc-email"
                    type="email"
                    data-testid="calculator-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'calc-email-error' : undefined}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[44px] transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                    style={{
                      borderColor: emailError ? 'var(--color-danger)' : 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {emailError && (
                    <p id="calc-email-error" role="alert" className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                      {emailError}
                    </p>
                  )}
                </div>

                {networkError && (
                  <p role="alert" className="text-xs text-center" style={{ color: 'var(--color-danger)' }}>
                    {networkError}
                  </p>
                )}

                <button
                  type="submit"
                  data-testid="calculator-email-submit-button"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="w-full px-5 py-3 rounded-lg text-sm font-semibold text-white min-h-[44px] transition-all hover:opacity-90 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {isSubmitting ? '⟳ Enviando...' : 'Ver resultado completo →'}
                </button>

                <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Sem spam. Seus dados são tratados conforme nossa{' '}
                  <a href="/privacidade" className="underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded" style={{ color: 'var(--color-accent)' }}>
                    Política de Privacidade
                  </a>.
                </p>

                <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Ou{' '}
                  <a
                    data-testid="calculator-whatsapp-link"
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded"
                    style={{ color: '#25D366' }}
                  >
                    fale pelo WhatsApp
                  </a>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
