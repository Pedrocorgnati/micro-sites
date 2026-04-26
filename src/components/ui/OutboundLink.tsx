'use client';

// src/components/ui/OutboundLink.tsx
// Fonte: TASK-1 intake-review (CL-322, CL-323)
// Componente generico de link outbound que emite `outbound_click`
// e aplica UTM via appendUtm. Complementa analytics/OutboundLink (systemforge).

import { AnchorHTMLAttributes, MouseEvent } from 'react';
import { trackEvent } from '@/lib/analytics';
import { appendUtm, type UtmInput } from '@/lib/utm-builder';

export interface OutboundLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  utm?: UtmInput;
  siteOrigin?: string;
  eventParams?: Record<string, unknown>;
}

function resolveDefaultSiteOrigin(): string {
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.NEXT_PUBLIC_SITE_SLUG ??
      process.env.SITE_SLUG ??
      'unknown'
    );
  }
  return 'unknown';
}

function isCrossDomain(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function OutboundLink({
  href,
  utm,
  siteOrigin,
  eventParams,
  onClick,
  target,
  rel,
  children,
  ...rest
}: OutboundLinkProps) {
  const origin = siteOrigin ?? resolveDefaultSiteOrigin();
  const finalHref = utm ? appendUtm(href, utm) : href;
  const crossDomain = isCrossDomain(finalHref);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    trackEvent('outbound_click', {
      destination: finalHref,
      site_origin: origin,
      ...eventParams,
    });
    onClick?.(e);
  }

  return (
    <a
      href={finalHref}
      onClick={handleClick}
      target={target ?? (crossDomain ? '_blank' : undefined)}
      rel={rel ?? (crossDomain ? 'noopener noreferrer' : undefined)}
      {...rest}
    >
      {children}
    </a>
  );
}
