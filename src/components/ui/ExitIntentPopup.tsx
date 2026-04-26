'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { PAGE_ROUTES } from '@/types';

// Paths where the popup should never appear (INT-038)
const BLOCKED_PATHS = [PAGE_ROUTES.thanks, PAGE_ROUTES.privacy, '/lista-de-espera'];

export interface ExitIntentPopupProps {
  /** Site slug — used as localStorage key suffix */
  slug: string;
  /** Main offer headline */
  offerText?: string;
  /** Optional subtext below headline */
  offerSubtext?: string;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA destination (anchor or path) */
  ctaHref?: string;
  /** Show popup only once per browser session/origin (default: true) */
  triggerOnce?: boolean;
  /** Called after popup closes */
  onClose?: () => void;
}

export function ExitIntentPopup({
  slug,
  offerText = 'Espere! Antes de você ir...',
  offerSubtext,
  ctaLabel = 'Resolver Meu Problema',
  ctaHref = '#contato',
  triggerOnce = true,
  onClose,
}: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const storageKey = `exit_popup_shown_${slug}`;
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBlocked = BLOCKED_PATHS.some((p) => pathname?.startsWith(p));

  const closePopup = () => {
    setIsOpen(false);
    onClose?.();
    previousFocusRef.current?.focus();
  };

  useEffect(() => {
    if (isBlocked) return;

    const tryOpen = () => {
      try {
        if (triggerOnce && localStorage.getItem(storageKey) === '1') return;
        try {
          localStorage.setItem(storageKey, '1');
        } catch {
          // Private browsing — proceed without storage
        }
      } catch {
        // localStorage unavailable — proceed anyway (graceful degradation)
      }
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setIsOpen(true);
    };

    const isMobile = typeof window !== 'undefined'
      ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
      : false;

    if (isMobile) {
      // Mobile: open after 30s of inactivity; reset on touch
      const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(tryOpen, 30_000);
      };
      resetTimer();
      document.addEventListener('touchstart', resetTimer, { passive: true });
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        document.removeEventListener('touchstart', resetTimer);
      };
    } else {
      // Desktop: open when mouse leaves through top edge
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) tryOpen();
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [isBlocked, storageKey, triggerOnce]);

  // Escape key + focus trap handler (WCAG 2.1 AA — role="dialog")
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closePopup(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePopup();
      }}
      aria-hidden={false}
      data-testid="exit-popup-overlay"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-popup-title"
        data-testid="exit-popup-dialog"
        className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={closePopup}
          aria-label="Fechar popup"
          className="absolute top-3 right-3 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Offer headline */}
        <h2
          id="exit-popup-title"
          className="text-xl font-bold pr-10 mb-2 leading-snug"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          {offerText}
        </h2>

        {/* Optional subtext */}
        {offerSubtext && (
          <p
            className="text-sm mb-4 leading-relaxed"
            style={{ color: 'var(--color-text-secondary, #6B7280)' }}
          >
            {offerSubtext}
          </p>
        )}

        {/* Primary CTA */}
        <a
          href={ctaHref}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onClick={closePopup}
          className="mt-4 block w-full text-center font-semibold py-3 px-6 rounded-xl min-h-[44px] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: 'var(--color-accent, #C2410C)',
            color: 'var(--color-on-accent, #ffffff)',
          }}
        >
          {ctaLabel}
        </a>

        {/* Secondary dismiss */}
        <button
          type="button"
          onClick={closePopup}
          className="mt-3 block w-full text-center text-sm min-h-[44px] transition-colors hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-lg"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Não, obrigado
        </button>
      </div>
    </div>
  );
}
