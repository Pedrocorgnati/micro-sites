import Link from 'next/link';
import { loadSiteConfig } from '@/lib/config-loader';

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';

export default function NotFoundPage() {
  const config = loadSiteConfig(SITE_SLUG);

  return (
    <main
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-24 text-center"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <p
        className="text-7xl font-extrabold mb-4"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
        aria-hidden="true"
      >
        404
      </p>
      <h1
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
      >
        Página não encontrada
      </h1>
      <p className="text-base mb-8 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
        A página que você está procurando não existe ou foi movida.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Voltar ao Início
        </Link>
        <Link
          href="/contato"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-semibold text-sm border-2 transition-all duration-150 active:scale-95"
          style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          Falar com {config.name}
        </Link>
      </div>
    </main>
  );
}
