'use client';

import { AnchorHTMLAttributes, MouseEvent } from 'react';
import { trackEvent, isSystemForgeHost } from '@/lib/analytics';
import { appendUtm, type UtmInput } from '@/lib/utm-builder';

interface OutboundLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  fromSlug?: string;
  utm?: UtmInput;
}

export function OutboundLink({ href, fromSlug, utm, onClick, target, rel, children, ...rest }: OutboundLinkProps) {
  const finalHref = utm ? appendUtm(href, utm) : href;
  const isSF = isSystemForgeHost(finalHref);
  const isExternal = /^https?:\/\//i.test(finalHref);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    const origin = fromSlug ?? 'unknown';
    // CL-322: canonical outbound_click emitido em todo link externo.
    if (isExternal) {
      trackEvent('outbound_click', { destination: finalHref, site_origin: origin });
    }
    if (isSF) {
      trackEvent('outbound_to_systemforge', { from: origin, dest: finalHref });
    }
    onClick?.(e);
  }

  return (
    <a
      href={finalHref}
      onClick={handleClick}
      target={target ?? (isSF || isExternal ? '_blank' : undefined)}
      rel={rel ?? (isSF || isExternal ? 'noopener noreferrer' : undefined)}
      {...rest}
    >
      {children}
    </a>
  );
}
