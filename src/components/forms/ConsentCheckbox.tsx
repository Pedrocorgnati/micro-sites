'use client';

// src/components/forms/ConsentCheckbox.tsx
// Fonte: TASK-2 intake-review (CL-235) — LGPD Art. 8 consent destacado e especifico.
// Componente unico e reutilizavel para todos os formularios da rede.

import Link from 'next/link';
import type { FieldError, UseFormRegister, FieldValues, Path } from 'react-hook-form';
import { CONSENT_COPY } from '@/lib/constants';
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy-version';

export interface ConsentCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  /** Override do id do input para casos com multiplos forms na mesma pagina. */
  id?: string;
  /** Permite ajustar data-testid por contexto de form. */
  testId?: string;
}

export function ConsentCheckbox<T extends FieldValues>({
  name,
  register,
  error,
  id,
  testId = 'consent-checkbox',
}: ConsentCheckboxProps<T>) {
  const inputId = id ?? `consent-${String(name)}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex items-start gap-3">
      {/* CL-242: log da versao da PrivacyPolicy aceita junto a cada submit */}
      <input
        type="hidden"
        name="privacy_version"
        value={PRIVACY_POLICY_VERSION}
        data-testid="consent-privacy-version"
      />
      <input
        id={inputId}
        type="checkbox"
        data-testid={testId}
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...register(name)}
        className="mt-1 min-h-[20px] min-w-[20px] rounded cursor-pointer"
        style={{ accentColor: 'var(--color-accent)' }}
      />
      <div>
        <label
          htmlFor={inputId}
          className="text-sm cursor-pointer select-none"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {CONSENT_COPY.label}{' '}
          <Link
            href={CONSENT_COPY.privacyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            style={{ color: 'var(--color-accent)' }}
          >
            Política de Privacidade
          </Link>{' '}
          <span aria-hidden="true">*</span>
        </label>
        {error && (
          <span
            id={errorId}
            role="alert"
            className="block text-xs text-red-600 mt-1"
          >
            {error.message ?? CONSENT_COPY.errorMessage}
          </span>
        )}
      </div>
    </div>
  );
}
