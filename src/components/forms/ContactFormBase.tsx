'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HoneypotField } from './HoneypotField';
import { useToast } from '@/components/ui/Toast';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

// ============================================================
// Schema de validação
// ============================================================

const schema = z.object({
  name:     z.string().min(2, 'nome é obrigatório'),
  email:    z.string().email('Informe um e-mail válido (ex: nome@email.com)'),
  phone:    z.string().optional().refine(
    (v) => !v || /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.trim()),
    { message: 'Informe um telefone válido (ex: (11) 99999-9999)' },
  ),
  message:  z.string().min(10, 'mensagem é obrigatória'),
  consent:  z.literal(true, { error: 'Você precisa aceitar para continuar' }),
  honeypot: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

type FormState = 'idle' | 'submitting' | 'error';

// ============================================================
// Props
// ============================================================

interface ContactFormBaseProps {
  formEndpoint: string;
  whatsappNumber: string;
  whatsappMessage?: string;
  siteName?: string;
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
  accessKey,
}: ContactFormBaseProps) {
  const { addToast } = useToast();
  const [formState, setFormState] = useState<FormState>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = methods;

  async function onSubmit(data: FormValues) {
    // Silent drop se honeypot preenchido (bot)
    if (data.honeypot) return;

    setFormState('submitting');

    abortRef.current = new AbortController();
    const timer = setTimeout(() => abortRef.current?.abort(), 10_000);

    try {
      const payload = {
        accessKey: accessKey ?? '',
        subject: `Contato via ${siteName ?? 'site'}`,
        name: data.name,
        email: data.email,
        phone: data.phone ?? '',
        message: data.message,
        replyTo: data.email,
        '$honeypot': '',
      };

      const res = await fetch(formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      clearTimeout(timer);

      if (!res.ok) throw new Error('Erro do servidor');

      // Disparar GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'contact_form_submit', {
          site_name: siteName,
          method: 'static_forms',
        });
      }

      window.location.href = '/obrigado';
    } catch (err) {
      clearTimeout(timer);
      setFormState('error');
      addToast('error', 'Erro ao enviar. Tente novamente ou use o WhatsApp.');
    }
  }

  const whatsappFallbackUrl = buildWhatsAppUrl(whatsappNumber, whatsappMessage);
  const isSubmitting = formState === 'submitting';
  const isError = formState === 'error';

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        data-testid="contact-form"
        onSubmit={handleSubmit(onSubmit)}
        className="relative max-w-[600px] mx-auto w-full flex flex-col gap-5"
      >
        <HoneypotField />

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

        {/* Consentimento LGPD */}
        <div className="flex items-start gap-3">
          <input
            id="consent"
            type="checkbox"
            data-testid="contact-form-consent-checkbox"
            aria-required="true"
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            {...register('consent')}
            className="mt-1 min-h-[20px] min-w-[20px] rounded accent-current cursor-pointer"
            style={{ accentColor: 'var(--color-accent)' }}
          />
          <div>
            <label
              htmlFor="consent"
              className="text-sm cursor-pointer select-none"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Concordo com o tratamento dos meus dados conforme a{' '}
              <Link
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
                style={{ color: 'var(--color-accent)' }}
              >
                Política de Privacidade
              </Link>{' '}
              <span aria-hidden="true">*</span>
            </label>
            {errors.consent && (
              <span id="consent-error" role="alert" className="block text-xs text-red-600 mt-1">
                {errors.consent.message}
              </span>
            )}
          </div>
        </div>

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

        {/* Fallback WhatsApp (visível apenas em estado de erro) */}
        {isError && (
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Ou clique aqui para falar pelo WhatsApp
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
              className="text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: '#25D366' }}
            >
              Falar pelo WhatsApp
            </a>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
