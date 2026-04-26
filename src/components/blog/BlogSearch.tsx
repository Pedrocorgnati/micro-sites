'use client';

import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { BlogArticle } from '@/types';
import { BlogList } from './BlogList';

interface BlogSearchProps {
  articles: BlogArticle[];
  siteSlug: string;
}

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.3 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export function BlogSearch({ articles, siteSlug }: BlogSearchProps) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => new Fuse(articles, FUSE_OPTIONS), [articles]);

  const filtered = query.trim().length >= 2
    ? fuse.search(query).map((r) => r.item)
    : articles;

  return (
    <div data-testid="blog-search-wrapper">
      <div className="mb-8">
        <label htmlFor="blog-search-input" className="sr-only">
          Buscar artigos
        </label>
        <input
          id="blog-search-input"
          data-testid="blog-search-input"
          type="search"
          placeholder="Buscar artigos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md px-4 py-3 min-h-[44px] rounded-lg border text-sm transition-colors duration-150 focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            // @ts-expect-error -- CSS custom property for focus ring
            '--tw-ring-color': 'var(--color-accent)',
          }}
        />
        {query.trim().length >= 2 && (
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
            aria-live="polite"
          >
            {filtered.length === 0
              ? 'Nenhum artigo encontrado.'
              : `${filtered.length} artigo${filtered.length > 1 ? 's' : ''} encontrado${filtered.length > 1 ? 's' : ''}.`}
          </p>
        )}
      </div>

      <BlogList articles={filtered} siteSlug={siteSlug} />
    </div>
  );
}
