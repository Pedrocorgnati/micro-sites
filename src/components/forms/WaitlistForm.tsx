'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HoneypotField } from './HoneypotField';
import { ConsentCheckbox } from './ConsentCheckbox';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { CONSENT_COPY, getFormEndpoint } from '@/lib/constants';
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy-version';
import { recordFailure, recordSuccess, shouldSkipRequest } from '@/lib/circuit-breaker';
import { TIMING } from '@/types';
import { useOnlineStatus } from '@/lib/network-status';

// ============================================================
// Schema (Zod v4)
// ============================================================

// CL-213: opcao "Outro" no select de porte com campo livre
const COMPANY_SIZE_OPTIONS = ['mei', 'pequena', 'media', 'grande', 'other'] as const;

const WaitlistSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email('Informe um e-mail válido (ex: nome@email.com)'),
    companySize: z.enum(COMPANY_SIZE_OPTIONS).optional(),
    companySizeOther: z.string().max(80).optional(),
    lgpdConsent: z.literal(true, {
      error: CONSENT_COPY.errorMessage,
    }),
    honeypot: z.string().max(0).optional(),
  })
  .refine(
    (data) => data.companySize !== 'other' || (data.companySizeOther && data.companySizeOther.trim().length > 0),
    { message: 'Descreva o porte em "Outro"', path: ['companySizeOther'] },
  );

type WaitlistFormValues = z.infer<typeof WaitlistSchema>;

type FormState = 'idle' | 'submitting' | 'success' | 'error';

// ============================================================
// Props
// ============================================================

export interface WaitlistFormProps {
  slug: string;
  productName?: string;
  waitlistCount?: number;
  earlyBirdDiscount?: string;
  /** Static Forms endpoint or API route */
  endpoint?: string;
  whatsappNumber?: string;
}

// ============================================================
// Component
// ============================================================

export function WaitlistForm({
  slug,
  productName,
  waitlistCount,
  earlyBirdDiscount,
  endpoint,
  whatsappNumber,
}: WaitlistFormProps) {
  const [formState, setFormState] = useState<FormState>('idle');
  // TASK-19 ST001 / CL-157: detectar offline.
  const isOnline = useOnlineStatus();

  const methods = useForm<WaitlistFormValues>({
    resolver: zodResolver(WaitlistSchema),
    mode: 'onSubmit',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  async function onSubmit(data: WaitlistFormValues) {
    // Silent drop on honeypot (bot)
    if (data.honeypot) return;

    // CL-496: circuit breaker — pula direto ao fallback WA se aberto
    if (shouldSkipRequest('static-forms')) {
      setFormState('error');
      return;
    }

    setFormState('submitting');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMING.formTimeoutMs);

    try {
      // TASK-20 ST002: resolve via getFormEndpoint (slug+type override env -> fallback canonico)
      const target = getFormEndpoint('waitlist', { slug, siteOverride: endpoint });
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          subject: `Lista de Espera — ${productName ?? slug}`,
          name: data.name ?? '(anônimo)',
          email: data.email,
          site: slug,
          company_size: data.companySize ?? '',
          company_size_other: data.companySize === 'other' ? data.companySizeOther ?? '' : '',
          // CL-242: log versao da PrivacyPolicy aceita
          privacy_version: PRIVACY_POLICY_VERSION,
          '$honeypot': '',
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) throw new Error('Servidor indisponível');

      // CL-496: sucesso -> reset breaker
      recordSuccess('static-forms');

      // GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'waitlist_signup', { site_slug: slug });
      }

      setFormState('success');
    } catch {
      clearTimeout(timer);
      recordFailure('static-forms');
      setFormState('error');
    }
  }

  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(
        whatsappNumber,
        `Olá! Vi o site ${productName ?? slug} e tenho interesse.`,
      )
    : null;

  // TASK-9 / CL-330: fallback com contexto dos valores digitados
  function buildErrorFallbackUrl(): string | null {
    if (!whatsappNumber) return null;
    const values = methods.getValues();
    const nome = values.name?.trim();
    const email = values.email?.trim();
    const parts = [
      nome ? `Ola, sou ${nome}.` : 'Ola!',
      `Tentei entrar na lista de espera de ${productName ?? slug}`,
      email ? `com o email ${email}` : '',
      `(tentativa de envio pelo site ${slug} falhou).`,
    ].filter(Boolean);
    return buildWhatsAppUrl(whatsappNumber, parts.join(' '));
  }

  // ── Success state ──────────────────────────────────────────
  if (formState === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="waitlist-success"
        className="text-center py-10 px-4"
      >
        <div
          className="text-5xl mb-4"
          aria-hidden="true"
        >
          🎉
        </div>
        <h3
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          Você está na lista!
        </h3>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--color-text-secondary, #6B7280)' }}
        >
          Avisaremos assim que {productName ?? 'o produto'} estiver disponível.
        </p>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: '#25D366' }}
          >
            Falar pelo WhatsApp
          </a>
        )}
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <FormProvider {...methods}>
      <div>
        {/* Social proof — contador */}
        {waitlistCount != null && (
          <p
            className="text-sm text-center mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <strong style={{ color: 'var(--color-accent)' }}>
              {waitlistCount.toLocaleString('pt-BR')}
            </strong>{' '}
            pessoas já na lista de espera
          </p>
        )}

        {/* Early bird banner */}
        {earlyBirdDiscount && (
          <div
            className="rounded-lg px-4 py-3 mb-6 text-center text-sm font-medium border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            {earlyBirdDiscount}
          </div>
        )}

        <form
          noValidate
          data-testid="waitlist-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <HoneypotField />

          {/* TASK-19 ST001 / CL-157 — banner offline. */}
          {!isOnline && (
            <div
              data-testid="form-offline-banner"
              role="status"
              aria-live="polite"
              className="rounded-lg border p-3 text-sm"
              style={{ borderColor: '#FCD34D', background: '#FEF3C7', color: '#78350F' }}
            >
              <strong>Voce esta offline.</strong> A inscricao na lista so funciona com conexao.
              {whatsappNumber && (
                <>
                  {' '}Use o WhatsApp:{' '}
                  <a
                    href={buildWhatsAppUrl(whatsappNumber, `Quero entrar na lista de espera de ${productName ?? 'produto'}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', fontWeight: 600 }}
                  >
                    abrir WhatsApp
                  </a>
                  .
                </>
              )}
            </div>
          )}

          {/* Nome (opcional) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-name"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary, #111827)' }}
            >
              Nome{' '}
              <span
                className="font-normal text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                (opcional)
              </span>
            </label>
            <input
              id="wl-name"
              type="text"
              inputMode="text"
              autoComplete="name"
              placeholder="Seu nome"
              {...register('name')}
              className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 transition-colors"
              style={{ '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
            />
          </div>

          {/* E-mail (obrigatório) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-email"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary, #111827)' }}
            >
              E-mail <span aria-hidden="true">*</span>
            </label>
            <input
              id="wl-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'wl-email-error' : undefined}
              placeholder="seu@email.com"
              {...register('email')}
              className={cn(
                'w-full px-4 py-3 min-h-[44px] rounded-lg border bg-white text-base focus:outline-none focus:ring-2 transition-colors',
                errors.email ? 'border-red-400' : 'border-gray-200',
              )}
            />
            {errors.email && (
              <span
                id="wl-email-error"
                role="alert"
                className="text-xs text-red-600"
              >
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Porte da empresa (opcional) — CL-213 */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-company-size"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary, #111827)' }}
            >
              Porte da empresa{' '}
              <span className="font-normal text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                (opcional)
              </span>
            </label>
            <select
              id="wl-company-size"
              data-testid="waitlist-company-size"
              {...register('companySize')}
              className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 transition-colors"
              style={{ '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
              defaultValue=""
            >
              <option value="">Selecione...</option>
              <option value="mei">MEI / autonomo</option>
              <option value="pequena">Pequena (1-9)</option>
              <option value="media">Media (10-49)</option>
              <option value="grande">Grande (50+)</option>
              <option value="other">Outro</option>
            </select>
            {methods.watch('companySize') === 'other' && (
              <input
                id="wl-company-size-other"
                data-testid="waitlist-company-size-other"
                type="text"
                maxLength={80}
                placeholder="Descreva o porte (ate 80 caracteres)"
                aria-invalid={!!errors.companySizeOther}
                {...register('companySizeOther')}
                className={cn(
                  'mt-2 w-full px-4 py-3 min-h-[44px] rounded-lg border bg-white text-base focus:outline-none focus:ring-2 transition-colors',
                  errors.companySizeOther ? 'border-red-400' : 'border-gray-200',
                )}
              />
            )}
            {errors.companySizeOther && (
              <span role="alert" className="text-xs text-red-600">
                {errors.companySizeOther.message}
              </span>
            )}
          </div>

          {/* Consentimento LGPD — TASK-2 / CL-235: redacao canonica via CONSENT_COPY */}
          <ConsentCheckbox
            name="lgpdConsent"
            register={register}
            error={errors.lgpdConsent}
            id="wl-lgpd"
            testId="waitlist-consent-checkbox"
          />

          {/* Submit */}
          <button
            type="submit"
            data-testid="waitlist-submit"
            disabled={formState === 'submitting'}
            aria-busy={formState === 'submitting'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl font-semibold text-base transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-on-accent, #ffffff)',
            }}
          >
            {formState === 'submitting' ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Entrando na lista...
              </>
            ) : (
              'Entrar na Lista de Espera'
            )}
          </button>

          {/* Error state + WhatsApp fallback inline — TASK-9 / CL-330 */}
          {formState === 'error' && (
            <div
              role="alert"
              data-testid="waitlist-error"
              className="rounded-lg border p-4 text-center mt-2"
              style={{ borderColor: 'var(--color-accent)', backgroundColor: 'rgba(37,211,102,0.06)' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Nao foi possivel enviar agora.
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted, #6B7280)' }}>
                Seus dados foram preservados. Fale com a gente direto pelo WhatsApp — ja incluimos seu email.
              </p>
              {(() => {
                const fallback = buildErrorFallbackUrl();
                if (!fallback) return null;
                return (
                  <a
                    data-testid="waitlist-whatsapp-fallback"
                    href={fallback}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as any).gtag) {
                        (window as any).gtag('event', 'whatsapp_click', { trigger: 'waitlist_fallback' });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
                  >
                    Falar no WhatsApp agora
                  </a>
                );
              })()}
            </div>
          )}
        </form>
      </div>
    </FormProvider>
  );
}
