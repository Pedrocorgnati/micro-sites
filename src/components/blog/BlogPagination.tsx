import Link from 'next/link';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  /** Gera href para a pagina N (default: /blog e /blog/page/N). */
  hrefFor?: (page: number) => string;
}

function defaultHref(page: number): string {
  return page <= 1 ? '/blog' : `/blog/page/${page}`;
}

export function BlogPagination({
  currentPage,
  totalPages,
  hrefFor = defaultHref,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      data-testid="blog-pagination"
      aria-label="Paginação do blog"
      className="flex items-center justify-center gap-2 mt-10 flex-wrap"
    >
      {currentPage > 1 && (
        <Link
          href={hrefFor(currentPage - 1)}
          data-testid="blog-pagination-prev"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
          style={{ color: 'var(--color-accent)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          aria-label="Página anterior"
        >
          ← Anterior
        </Link>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          data-testid={`blog-pagination-page-${p}`}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
          style={
            p === currentPage
              ? { backgroundColor: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)' }
              : { color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }
          }
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={hrefFor(currentPage + 1)}
          data-testid="blog-pagination-next"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
          style={{ color: 'var(--color-accent)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          aria-label="Próxima página"
        >
          Próximo →
        </Link>
      )}
    </nav>
  );
}
