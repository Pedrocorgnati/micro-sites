/**
 * ADS-40 — Matriz de elegibilidade de ads por rota.
 *
 * Decisao DEC-04 (Codex thread 019dd498). Default no-ad; rotas explicitamente
 * marcadas `allowed`/`conditional` podem renderizar AdSlot.
 *
 * Regras Cat A (saude — INV-ADS-07):
 *   /diagnostico e /resultado sao SEMPRE blocked, mesmo se config.routesAllowed
 *   incluir. Google Publisher Policies veda inferencia baseada em saude.
 */

import type { SiteConfigInput } from '@/schemas/config';

export type EligibilityState = 'allowed' | 'conditional' | 'blocked';

/** Rotas inelegiveis (vedadas por Google Publisher Policies — dead-end / error). */
const HARD_BLOCKED: ReadonlySet<string> = new Set([
  '/obrigado',
  '/lista-de-espera',
  '/resultado',
  '/404',
  '/_not-found',
]);

/** Rotas permitidas por default (conteudo editorial substancial). */
const HARD_ALLOWED: ReadonlySet<string> = new Set([
  '/',
  '/blog',
  '/faq',
]);

/** Rotas que aceitam opt-in via config.adsense.routesAllowed. */
const CONDITIONAL: ReadonlySet<string> = new Set([
  '/contato',
  '/privacidade',
  '/termos',
  '/cookies',
  '/diagnostico',
  '/quanto-custa',
  '/simulador',
]);

/** Rotas que sao SEMPRE blocked em Categoria A (saude), mesmo com opt-in. */
const CAT_A_FORCE_BLOCKED: ReadonlySet<string> = new Set([
  '/diagnostico',
  '/resultado',
]);

/**
 * Normaliza pathname removendo trailing slash (exceto root) e query/hash.
 * trailingSlash:true do Next gera /foo/ — comparamos sem ele.
 */
function normalize(pathname: string): string {
  const cleaned = pathname.split('?')[0]?.split('#')[0] ?? '/';
  if (cleaned === '/') return '/';
  // Remove trailing slash
  const stripped = cleaned.replace(/\/$/, '');
  // /blog/[slug] colapsa para /blog
  if (stripped.startsWith('/blog/') && stripped !== '/blog') return '/blog';
  return stripped;
}

export function isRouteEligibleForAds(
  pathname: string,
  config: SiteConfigInput,
): EligibilityState {
  const route = normalize(pathname);

  // Cat A force-block tem precedencia sobre tudo.
  if (config.category === 'A' && CAT_A_FORCE_BLOCKED.has(route)) {
    return 'blocked';
  }

  if (HARD_BLOCKED.has(route)) return 'blocked';
  if (HARD_ALLOWED.has(route)) return 'allowed';

  if (CONDITIONAL.has(route)) {
    const allowed = config.adsense?.routesAllowed ?? [];
    // Comparacao sem leading slash (config armazena sem).
    const routeKey = route.startsWith('/') ? route.slice(1) : route;
    if (allowed.includes(routeKey)) return 'conditional';
    return 'blocked';
  }

  // Rotas nao listadas: default blocked (INV-ADS-06 Zero Assumido).
  return 'blocked';
}

/** Helper: pode renderizar ad? (allowed OU conditional opt-in). */
export function canShowAds(pathname: string, config: SiteConfigInput): boolean {
  const state = isRouteEligibleForAds(pathname, config);
  return state === 'allowed' || state === 'conditional';
}
