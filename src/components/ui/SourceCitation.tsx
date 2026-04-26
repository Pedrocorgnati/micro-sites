// src/components/ui/SourceCitation.tsx
// Fonte: TASK-7 intake-review (CL-083) — E-E-A-T / autoridade de conteudo.
// Renderiza uma citacao inline (sup) com link para a fonte original.

import type { ReactNode } from 'react';

interface Props {
  label: string;
  url: string;
  year: number | string;
  children?: ReactNode;
}

export function SourceCitation({ label, url, year, children }: Props) {
  const title = `${label} (${year})`;
  return (
    <sup className="inline-block align-super text-[0.7em] ml-0.5">
      <a
        data-testid="source-citation"
        data-source={label}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        aria-label={`Fonte: ${title}`}
        className="underline decoration-dotted"
        style={{ color: 'var(--color-accent)' }}
      >
        {children ?? `[${year}]`}
      </a>
    </sup>
  );
}
