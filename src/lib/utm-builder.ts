/**
 * UTM builder — source unificada para identificar o micro-site de origem.
 * CL-115, CL-219.
 */

export type UtmInput = {
  slug: string;
  category: string;
  campaign?: string;
  content?: string;
};

export function buildUtmParams(input: UtmInput): string {
  const params = new URLSearchParams({
    utm_source: input.slug,
    utm_medium: `cat-${input.category.toLowerCase()}`,
    utm_campaign: input.campaign ?? 'micro-sites',
  });
  if (input.content) params.set('utm_content', input.content);
  return params.toString();
}

export function appendUtm(href: string, input: UtmInput): string {
  if (!href || href.startsWith('#')) return href;
  const qs = buildUtmParams(input);
  return href.includes('?') ? `${href}&${qs}` : `${href}?${qs}`;
}

export function originTag(slug: string): string {
  return `[origem: ${slug}]`;
}
