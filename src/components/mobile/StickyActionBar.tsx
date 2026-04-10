'use client';

/**
 * StickyActionBar — CTA fixo no rodapé em mobile (< 768px).
 *
 * Visível apenas em mobile. Em desktop o botão de submit/CTA fica inline.
 * O WhatsAppButton (z-50) fica acima deste componente (z-40).
 * Posição do WAB: bottom: calc(64px + safe-area-inset-bottom + 16px)
 */

import Link from 'next/link';

type ActionType = 'link' | 'submit' | 'button';

interface StickyActionBarProps {
  label: string;
  /** href para ActionType = 'link' */
  href?: string;
  actionType?: ActionType;
  /** formId para ActionType = 'submit' — dispara submit do form via form attribute */
  formId?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function StickyActionBar({
  label,
  href,
  actionType = 'link',
  formId,
  onClick,
  disabled = false,
}: StickyActionBarProps) {
  const baseClass =
    'inline-flex w-full items-center justify-center rounded-lg font-semibold text-base text-white min-h-[48px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  const style = {
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-accent)',
    color: disabled ? 'var(--color-text-muted)' : 'var(--color-on-accent)',
  };

  return (
    <div
      data-testid="sticky-action-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom)]"
      style={{
        paddingTop: '12px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        backgroundColor: 'var(--color-surface)',
        boxShadow: '0 -1px 0 0 var(--color-border), 0 -4px 12px 0 rgb(0 0 0 / 0.06)',
      }}
    >
      {actionType === 'link' && href ? (
        <Link
          data-testid="sticky-action-bar-cta"
          href={href}
          className={baseClass}
          style={style}
        >
          {label}
        </Link>
      ) : actionType === 'submit' ? (
        <button
          data-testid="sticky-action-bar-cta"
          type="submit"
          form={formId}
          disabled={disabled}
          onClick={onClick}
          className={baseClass}
          style={style}
        >
          {label}
        </button>
      ) : (
        <button
          data-testid="sticky-action-bar-cta"
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={baseClass}
          style={style}
        >
          {label}
        </button>
      )}
    </div>
  );
}
