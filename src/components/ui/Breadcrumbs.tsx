import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length < 2) return null;

  return (
    <nav data-testid="breadcrumbs" aria-label="Navegação estrutural" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" style={{ color: 'var(--color-text-muted)' }}>
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current="page"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors duration-150 hover:underline"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
