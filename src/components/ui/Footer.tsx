import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CookieManageButton } from '@/components/lgpd/CookieManageButton';
import { SF_BRAND } from '@/lib/brand-tokens';
import { OutboundLink } from '@/components/analytics/OutboundLink';
import type { UtmInput } from '@/lib/utm-builder';
import { appendUtm } from '@/lib/utm-builder';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface CrossLink {
  href: string;
  anchor: string;
  context: 'footer' | 'article' | 'cta' | 'resultado';
}

interface FooterProps {
  siteName: string;
  showSystemForgeLogo?: boolean;
  systemForgeUrl?: string;
  links?: FooterLink[];
  privacyUrl?: string;
  crossLinks?: CrossLink[];
  contactEmail?: string;
  className?: string;
  /** CL-323: slug do site de origem para montar UTM em outbound. */
  siteSlug?: string;
  /** CL-323: categoria do site para utm_medium. */
  siteCategory?: string;
}

export function Footer({
  siteName,
  showSystemForgeLogo = false,
  systemForgeUrl = 'https://systemforge.com.br',
  links = [],
  privacyUrl = '/privacidade',
  crossLinks = [],
  contactEmail,
  className,
  siteSlug,
  siteCategory,
}: FooterProps) {
  const year = new Date().getFullYear();

  // CL-323: monta UTM padrao para outbound do footer (network cross-sell).
  const footerUtm: UtmInput | undefined =
    siteSlug && siteCategory
      ? { slug: siteSlug, category: siteCategory, campaign: 'network', content: 'footer' }
      : undefined;
  const crossLinkUtm: UtmInput | undefined =
    siteSlug && siteCategory
      ? { slug: siteSlug, category: siteCategory, campaign: 'cross-sell', content: 'footer' }
      : undefined;

  // Apenas cross-links de contexto "footer" são renderizados aqui
  const footerCrossLinks = crossLinks.filter((cl) => cl.context === 'footer');

  return (
    <footer
      data-testid="footer"
      className={cn(
        'border-t bg-[#1F2937] py-8',
        className,
      )}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Lado esquerdo — copyright */}
          <p data-testid="footer-copyright" className="text-sm" style={{ color: '#D1D5DB' }}>
            © {year} {siteName}.
            {showSystemForgeLogo && (
              <>
                {' '}Desenvolvido por{' '}
                <OutboundLink
                  data-testid="footer-sf-logo"
                  href={systemForgeUrl ?? SF_BRAND.url}
                  fromSlug={siteSlug}
                  utm={footerUtm}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors duration-150"
                  style={{ color: '#D1D5DB' }}
                >
                  <Image
                    src={SF_BRAND.logo.white}
                    alt="SystemForge"
                    width={18}
                    height={18}
                    unoptimized
                  />
                  <span>SystemForge</span>
                </OutboundLink>
              </>
            )}
          </p>

          {/* Lado direito — links */}
          <nav data-testid="footer-nav" aria-label="Links do rodapé">
            <ul className="flex flex-wrap items-center gap-4">
              <li>
                <Link
                  data-testid="footer-privacy-link"
                  href={privacyUrl}
                  className="text-sm transition-colors duration-150 hover:text-white"
                  style={{ color: '#D1D5DB' }}
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  data-testid="footer-terms-link"
                  href="/termos"
                  className="text-sm transition-colors duration-150 hover:text-white"
                  style={{ color: '#D1D5DB' }}
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  data-testid="footer-cookies-link"
                  href="/cookies"
                  className="text-sm transition-colors duration-150 hover:text-white"
                  style={{ color: '#D1D5DB' }}
                >
                  Cookies
                </Link>
              </li>
              {contactEmail && (
                <li>
                  <a
                    data-testid="footer-email-link"
                    href={`mailto:${contactEmail}`}
                    className="text-sm transition-colors duration-150 hover:text-white"
                    style={{ color: '#D1D5DB' }}
                  >
                    {contactEmail}
                  </a>
                </li>
              )}
              <li>
                <CookieManageButton />
              </li>
              {links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: '#D1D5DB' }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: '#D1D5DB' }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Cross-links contextuais (Padrão A→C, RC-INT-002) */}
        {footerCrossLinks.length > 0 && (
          <div
            data-testid="footer-cross-links"
            className="mt-6 pt-4 border-t flex flex-wrap gap-x-6 gap-y-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {footerCrossLinks.map((cl) => (
              <a
                key={cl.href}
                href={crossLinkUtm ? appendUtm(cl.href, crossLinkUtm) : cl.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors duration-150 hover:text-white"
                style={{ color: '#6B7280' }}
              >
                {cl.anchor}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
