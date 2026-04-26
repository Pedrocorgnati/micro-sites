'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HoneypotField } from './HoneypotField';
import { ConsentCheckbox } from './ConsentCheckbox';
import { useToast } from '@/components/ui/Toast';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { CONSENT_COPY, getFormEndpoint } from '@/lib/constants';
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy-version';
import { recordFailure, recordSuccess, shouldSkipRequest } from '@/lib/circuit-breaker';
import { useOnlineStatus } from '@/lib/network-status';
import { useEffect } from 'react';

// ============================================================
// Schema de validação
// ============================================================

const schema = z.object({
  name:     z.string().min(3, 'Informe pelo menos 3 caracteres'),
  email:    z.string().email('Informe um e-mail válido (ex: nome@email.com)'),
  phone:    z.string().optional().refine(
    (v) => !v || /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.trim()),
    { message: 'Informe um telefone válido (ex: (11) 99999-9999)' },
  ),
  message:  z.string().min(10, 'Mínimo de 10 caracteres').max(500, 'Máximo de 500 caracteres'),
  consent:  z.literal(true, { error: CONSENT_COPY.errorMessage }),
  honeypot: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

type FormState = 'idle' | 'submitting' | 'error';

// ============================================================
// Props
// ============================================================

interface ContactFormBaseProps {
  /**
   * Endpoint explicito do site (config.cta.formEndpoint). Quando ausente,
   * resolve via getFormEndpoint('contact', { slug: siteSlug }) — TASK-20 ST002.
   */
  formEndpoint?: string;
  whatsappNumber: string;
  whatsappMessage?: string;
  siteName?: string;
  siteSlug?: string;
  accessKey?: string;
}

// ============================================================
// Component
// ============================================================

export function ContactFormBase({
  formEndpoint,
  whatsappNumber,
  whatsappMessage = 'Olá! Tive um problema ao enviar o formulário e gostaria de falar.',
  siteName,
  siteSlug,
  accessKey,
}: ContactFormBaseProps) {
  const { addToast } = useToast();
  const [formState, setFormState] = useState<FormState>('idle');
  const abortRef = useRef<AbortController | null>(null);
  // TASK-19 ST001 / CL-157: detectar offline para mensagem dedicada + esconder submit.
  const isOnline = useOnlineStatus();

  // TASK-19 ST002 / CL-155: state preservation via sessionStorage por slug.
  const STORAGE_KEY = `contact-form-state:${siteSlug ?? 'default'}`;

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  });

  // TASK-19 ST002: hidratar form com state preservado (se ha) ao montar.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormValues>;
        methods.reset({
          name: parsed.name ?? '',
          email: parsed.email ?? '',
          phone: parsed.phone ?? '',
          message: parsed.message ?? '',
          consent: parsed.consent ?? false,
          honeypot: '',
        } as FormValues);
      }
    } catch {
      // ignore — sessionStorage indisponivel
    }
    // Persistir on change
    const sub = methods.watch((vals) => {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            name: vals.name,
            email: vals.email,
            phone: vals.phone,
            message: vals.message,
            consent: vals.consent,
          }),
        );
      } catch {
        // ignore
      }
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = methods;

  async function onSubmit(data: FormValues) {
    // Silent drop se honeypot preenchido (bot)
    if (data.honeypot) return;

    // CL-496: circuit breaker — se aberto, pula fetch e envia direto ao WA
    if (shouldSkipRequest('static-forms')) {
      setFormState('error');
      addToast('error', 'Servico de formulario instavel. Use o WhatsApp para falar agora.');
      return;
    }

    setFormState('submitting');

    abortRef.current = new AbortController();
    const timer = setTimeout(() => abortRef.current?.abort(), 10_000);

    try {
      const siteOrigin = siteSlug ? `Vim do site ${siteSlug}. ` : '';
      // TASK-7 / CL-013: identificar origem D03/D04 no payload para
      // roteamento de nurture (email alert + WhatsApp follow-up).
      const nurturePriorityTag = siteSlug?.startsWith('d03')
        ? 'D03'
        : siteSlug?.startsWith('d04')
        ? 'D04'
        : undefined;
      const payload = {
        accessKey: accessKey ?? '',
        subject: `Contato via ${siteName ?? 'site'}`,
        name: data.name,
        email: data.email,
        phone: data.phone ?? '',
        message: `${siteOrigin}${data.message}`,
        replyTo: data.email,
        source: siteSlug ?? '',
        nurture_priority_tag: nurturePriorityTag,
        // CL-242: registro de versao da PrivacyPolicy aceita
        privacy_version: PRIVACY_POLICY_VERSION,
        '$honeypot': '',
      };

      const target = getFormEndpoint('contact', { slug: siteSlug, siteOverride: formEndpoint });
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      clearTimeout(timer);

      if (!res.ok) throw new Error('Erro do servidor');

      // CL-496: sucesso -> reset breaker
      recordSuccess('static-forms');

      // TASK-19 ST002: limpar state preservado apos sucesso
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }

      // Disparar GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'contact_form_submit', {
          site_name: siteName,
          site_slug: siteSlug,
          method: 'static_forms',
        });
      }

      window.location.href = '/obrigado';
    } catch (err) {
      clearTimeout(timer);
      // CL-496: registrar falha (3 em 5min abre o breaker)
      recordFailure('static-forms');
      setFormState('error');
      addToast('error', 'Erro ao enviar. Tente novamente ou use o WhatsApp.');
    }
  }

  const isSubmitting = formState === 'submitting';
  const isError = formState === 'error';

  // TASK-9 / CL-330: fallback WhatsApp preserva nome + mensagem do usuario
  // e sinaliza que o envio pelo site falhou.
  function buildFallbackUrl(): string {
    if (!isError) return buildWhatsAppUrl(whatsappNumber, whatsappMessage);
    const values = methods.getValues();
    const nome = values.name?.trim();
    const msg = values.message?.trim();
    const slugPart = siteSlug ? ` ${siteSlug}` : '';
    const parts = [
      nome ? `Ola, sou ${nome}.` : 'Ola!',
      msg ? `Mensagem: ${msg}` : '',
      `(tentativa de envio pelo site${slugPart} falhou)`,
    ].filter(Boolean);
    return buildWhatsAppUrl(whatsappNumber, parts.join(' '));
  }
  const whatsappFallbackUrl = buildFallbackUrl();

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        data-testid="contact-form"
        onSubmit={handleSubmit(onSubmit)}
        className="relative max-w-[600px] mx-auto w-full flex flex-col gap-5"
      >
        <HoneypotField />
        <input type="hidden" name="_origin" value={process.env.NEXT_PUBLIC_SITE_SLUG ?? process.env.SITE_SLUG ?? ''} data-testid="contact-form-origin" />

        {/* TASK-19 ST001 / CL-157 — banner offline com WhatsApp fallback. */}
        {!isOnline && (
          <div
            data-testid="form-offline-banner"
            role="status"
            aria-live="polite"
            className="rounded-lg border p-3 text-sm"
            style={{ borderColor: '#FCD34D', background: '#FEF3C7', color: '#78350F' }}
          >
            <strong>Voce esta offline.</strong> O envio pelo site so funciona com conexao.
            Use o WhatsApp para falar agora:{' '}
            <a
              href={whatsappFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="form-offline-wa-link"
              style={{ textDecoration: 'underline', fontWeight: 600 }}
            >
              abrir WhatsApp
            </a>
            .
          </div>
        )}

        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="name"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Nome <span aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            type="text"
            inputMode="text"
            data-testid="contact-form-name-input"
            autoComplete="name"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            placeholder="Seu nome"
            {...register('name')}
            className={cn(
              'w-full px-4 py-3 min-h-[44px] rounded-lg border bg-white text-base transition-colors duration-150',
              'focus:outline-none focus:ring-2',
              errors.name
                ? 'border-red-400 animate-shake'
                : 'border-gray-200 focus:border-transparent',
            )}
            style={{
              '--tw-ring-color': errors.name ? 'transparent' : 'var(--color-accent)',
            } as React.CSSProperties}
          />
          {errors.name && (
            <span id="name-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* E-mail */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            E-mail <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            data-testid="contact-form-email-input"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            placeholder="seu@email.com"
            {...register('email')}
            className={cn(
              'w-full px-4 py-3 min-h-[44px] rounded-lg border bg-white text-base transition-colors duration-150',
              'focus:outline-none focus:ring-2',
              errors.email ? 'border-red-400 animate-shake' : 'border-gray-200',
            )}
          />
          {errors.email && (
            <span id="email-error" role="alert" className="text-xs text-red-600">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Telefone */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="phone"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Telefone / WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            data-testid="contact-form-phone-input"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            placeholder="(11) 99999-9999"
            {...register('phone')}
            className={cn(
              'w-full px-4 py-3 min-h-[44px] rounded-lg border bg-white text-base transition-colors duration-150',
              'focus:outline-none focus:ring-2',
              errors.phone ? 'border-red-400 animate-shake' : 'border-gray-200',
            )}
          />
          {errors.phone && (
            <span id="phone-error" role="alert" className="text-xs text-red-600">
              {errors.phone.message}
            </span>
          )}
        </div>

        {/* Mensagem */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="message"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Mensagem <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="message"
            rows={4}
            data-testid="contact-form-message-input"
            aria-required="true"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            placeholder="Descreva como podemos ajudar..."
            {...register('message')}
            className={cn(
              'w-full px-4 py-3 rounded-lg border bg-white text-base transition-colors duration-150 resize-none',
              'focus:outline-none focus:ring-2',
              errors.message ? 'border-red-400 animate-shake' : 'border-gray-200',
            )}
          />
          {errors.message && (
            <span id="message-error" role="alert" className="text-xs text-red-600">
              {errors.message.message}
            </span>
          )}
        </div>

        {/* Consentimento LGPD — TASK-2 / CL-235: redacao canonica via CONSENT_COPY */}
        <ConsentCheckbox
          name="consent"
          register={register}
          error={errors.consent}
          id="consent"
          testId="contact-form-consent-checkbox"
        />

        {/* Submit */}
        <button
          type="submit"
          data-testid="contact-form-submit-button"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg font-semibold text-base transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            'Enviar mensagem'
          )}
        </button>

        {/* Fallback WhatsApp inline (apenas em estado de erro) — TASK-9 / CL-330 */}
        {isError && (
          <div
            role="alert"
            data-testid="contact-form-error-fallback"
            className="rounded-lg border p-4 text-center"
            style={{ borderColor: 'var(--color-accent)', backgroundColor: 'rgba(37,211,102,0.06)' }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Nao foi possivel enviar agora.
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Seus dados foram preservados. Fale com a gente direto pelo WhatsApp — ja incluimos sua mensagem.
            </p>
            <a
              data-testid="contact-form-whatsapp-fallback"
              href={whatsappFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'whatsapp_click', { trigger: 'form_fallback' });
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
            >
              Falar no WhatsApp agora
            </a>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
