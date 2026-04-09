import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterProps {
  siteName: string;
  showSystemForgeLogo?: boolean;
  links?: FooterLink[];
  privacyUrl?: string;
  className?: string;
}

export function Footer({
  siteName,
  showSystemForgeLogo = false,
  links = [],
  privacyUrl = '/privacidade',
  className,
}: FooterProps) {
  const year = new Date().getFullYear();

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
          <p data-testid="footer-copyright" className="text-sm" style={{ color: '#9CA3AF' }}>
            © {year} {siteName}.
            {showSystemForgeLogo && (
              <>
                {' '}Desenvolvido por{' '}
                <a
                  href="https://systemforge.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-150"
                  style={{ color: '#9CA3AF' }}
                >
                  SystemForge
                </a>
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
                  style={{ color: '#9CA3AF' }}
                >
                  Política de Privacidade
                </Link>
              </li>
              {links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: '#9CA3AF' }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: '#9CA3AF' }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
