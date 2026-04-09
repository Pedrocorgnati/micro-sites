import Link from 'next/link';

interface NotFoundProps {
  siteName?: string;
}

export function NotFound({ siteName = 'este site' }: NotFoundProps) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
      >
        Página não encontrada
      </h1>
      <p className="text-base max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Esta página não existe em {siteName}. Que tal voltar ao início?
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold min-h-[44px] transition-colors duration-150 hover:opacity-90"
        style={{
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-on-accent)',
        }}
      >
        Voltar ao início
      </Link>
    </main>
  );
}
