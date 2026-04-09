'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavLink {
  label: string;
  href: string;
}

interface HeaderProps {
  siteName: string;
  navLinks?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
}

const DEFAULT_NAV: NavLink[] = [
  { label: 'Início', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contato', href: '/contato' },
];

export function Header({
  siteName,
  navLinks = DEFAULT_NAV,
  ctaLabel = 'Solicitar Orçamento',
  ctaHref = '/contato',
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menu on route change / resize
  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  return (
    <header
      data-testid="header"
      className="sticky top-0 z-40 w-full transition-shadow duration-200"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: isScrolled ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-white"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        Pular para o conteúdo
      </a>

      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          data-testid="header-logo"
          href="/"
          className="text-lg font-bold leading-none shrink-0"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
        >
          {siteName}
        </Link>

        {/* Desktop nav */}
        <nav data-testid="header-nav" aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              data-testid={`header-nav-link-${link.href.replace(/\//g, '').replace(/^$/, 'home')}`}
              href={link.href}
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          <Link
            data-testid="header-cta-button"
            href={ctaHref}
            className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
            style={{ backgroundColor: 'var(--color-accent)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-accent-hover, var(--color-accent))';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-accent)';
            }}
          >
            {ctaLabel}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          data-testid="header-mobile-menu-button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          data-testid="header-mobile-menu"
          className="md:hidden border-t"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <nav
            data-testid="header-mobile-nav"
            aria-label="Navegação mobile"
            className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col gap-1"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                data-testid={`header-mobile-nav-link-${link.href.replace(/\//g, '').replace(/^$/, 'home')}`}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center transition-colors duration-150"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              data-testid="header-mobile-cta-button"
              href={ctaHref}
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center px-5 py-3 min-h-[44px] rounded-lg font-semibold text-sm text-white text-center transition-all duration-150 active:scale-95"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {ctaLabel}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
