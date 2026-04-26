// src/lib/wave-interlinking.ts
// Interlinking progressivo por onda de deploy (gap CL-085 — TASK-1 ST004).
//
// Regra:
//   Onda 1: sites Onda 1 podem linkar APENAS para outros Onda 1 + landing SystemForge.
//   Onda 2: sites Onda <=2 podem linkar para qualquer Onda <=2 + landing SystemForge.
//   Onda 3: liberacao total da rede.
//
// Motivacao: evitar promocao prematura de sites nao-deployados (link para 404) e
// reduzir o footprint percebido pelo Google ate que a rede tenha densidade suficiente.

export type Wave = 1 | 2 | 3;

export interface CrossLinkInput {
  href: string;
  anchor: string;
  context: 'footer' | 'article' | 'cta' | 'resultado';
}

export interface SiteManifestEntry {
  slug: string;
  wave: Wave;
}

export const SYSTEMFORGE_HOSTS: readonly string[] = ['systemforge'];

/**
 * Retorna true se um link externo e permitido para a onda corrente,
 * dado o manifesto (slug -> wave) completo da rede.
 */
export function isCrossLinkAllowedForWave(
  link: CrossLinkInput,
  currentWave: Wave,
  manifest: ReadonlyArray<SiteManifestEntry>,
): boolean {
  const subdomain = extractSubdomain(link.href);
  if (subdomain === null) return false;
  if (SYSTEMFORGE_HOSTS.includes(subdomain)) return true;

  const target = resolveManifestEntry(subdomain, manifest);
  if (!target) return false;

  return target.wave <= currentWave;
}

/**
 * Filtra uma lista de crossLinks retornando apenas os permitidos para a onda atual.
 * Ordem e contextos sao preservados.
 */
export function getCrossLinksForWave(
  crossLinks: ReadonlyArray<CrossLinkInput>,
  currentWave: Wave,
  manifest: ReadonlyArray<SiteManifestEntry>,
): CrossLinkInput[] {
  return crossLinks.filter((cl) => isCrossLinkAllowedForWave(cl, currentWave, manifest));
}

/**
 * Extrai o subdominio (primeiro label) de uma URL https://{sub}.dominio.com.
 * Retorna null se URL invalida ou nao-HTTPS.
 */
export function extractSubdomain(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    return host.split('.')[0] ?? null;
  } catch {
    return null;
  }
}

function resolveManifestEntry(
  subdomain: string,
  manifest: ReadonlyArray<SiteManifestEntry>,
): SiteManifestEntry | undefined {
  const direct = manifest.find((m) => m.slug === subdomain);
  if (direct) return direct;
  // Suporte a slugs descritivos: "b01-sem-site-profissional" sendo referenciado por "b01".
  return manifest.find((m) => m.slug.startsWith(`${subdomain}-`));
}
