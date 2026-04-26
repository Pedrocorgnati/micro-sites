// src/lib/cross-link-sanitizer.ts
// Validação de segurança para cross-links entre micro-sites da rede
// Implementa allowlist de domínios e prevenção de open redirect (TASK-0 ST007)

/**
 * Domínios permitidos para cross-links.
 * Gerado a partir de sites/{slug}/config.json + landing page principal.
 * ATUALIZAR a cada nova onda de deploy (Onda 2, Onda 3).
 */
const ALLOWED_DOMAINS: readonly string[] = [
  // Categoria A — Nicho Vertical
  'a01', 'a02', 'a03', 'a04', 'a05', 'a06', 'a07', 'a08', 'a09', 'a10',
  // Categoria B — Dor/Problema
  'b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08',
  // Categoria C — Serviço
  'c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08',
  // Categoria D — Ferramenta
  'd01', 'd02', 'd03', 'd04', 'd05',
  // Categoria E — Pré-SaaS
  'e01', 'e02', 'e03',
  // Categoria F — Educativo
  'f01', 'f02',
  // Landing page principal
  'systemforge',
];

/**
 * Extrai o hostname de uma URL e verifica se pertence à rede de micro-sites.
 *
 * Aceita:
 * - https://{slug}.DOMAIN.com (subdomínio da rede)
 * - https://systemforge.com.br (landing page principal)
 *
 * Rejeita:
 * - http:// (non-HTTPS)
 * - URLs de domínios externos
 * - URLs malformadas
 */
export function isSafeExternalLink(href: string): boolean {
  try {
    const url = new URL(href);

    // Apenas HTTPS permitido
    if (url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Verifica se o subdomínio pertence a um slug da rede
    // Padrão: {slug}.DOMAIN.com ou {slug-descritivo}.DOMAIN.com
    const subdomain = hostname.split('.')[0];

    return ALLOWED_DOMAINS.some(
      (allowed) => subdomain === allowed || subdomain.startsWith(`${allowed}-`),
    );
  } catch {
    return false; // URL malformada
  }
}

/**
 * Verifica se um anchor text contém HTML tags (prevenção de XSS).
 * Retorna true se o texto é seguro (sem HTML).
 */
export function isSafeAnchorText(text: string): boolean {
  return !/<[^>]+>/.test(text);
}
