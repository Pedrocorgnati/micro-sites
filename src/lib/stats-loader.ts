// src/lib/stats-loader.ts
// Fonte: TASK-7 intake-review (CL-083) — E-E-A-T / estatisticas com fonte.
//
// Carrega stats.json do site (ou fallback para sites/_templates/stats-{cat}.json)
// para uso em HeroSection / ProblemSection / FeatureGrid etc.

import fs from 'node:fs';
import path from 'node:path';
import type { SiteCategory } from '@/types';

export interface StatClaim {
  id: string;
  value: string;
  text: string;
  source: {
    label: string;
    url: string;
    year: number | string;
  };
}

export interface StatsFile {
  category: SiteCategory;
  claims: StatClaim[];
}

const SITES_DIR = path.join(process.cwd(), 'sites');

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function loadStats(siteSlug: string, category: SiteCategory): StatsFile | null {
  const siteStats = readJson<StatsFile>(
    path.join(SITES_DIR, siteSlug, 'content', 'stats.json'),
  );
  if (siteStats) return siteStats;

  return readJson<StatsFile>(path.join(SITES_DIR, '_templates', `stats-${category}.json`));
}

export function findClaim(stats: StatsFile | null, claimId: string): StatClaim | undefined {
  return stats?.claims.find((c) => c.id === claimId);
}

const STAT_PLACEHOLDER = /\{\{stat:([a-z0-9_]+)(?::(value|text))?\}\}/gi;

/**
 * Substitui placeholders `{{stat:<id>}}` ou `{{stat:<id>:value|text}}` em uma
 * string pelo valor correspondente em stats.claims. Retorna tambem os claims
 * usados (para renderizar `<SourceCitation>` proximo ao numero).
 */
export function resolveStatText(
  input: string,
  stats: StatsFile | null,
): { text: string; usedClaims: StatClaim[] } {
  if (!stats) return { text: input, usedClaims: [] };
  const used = new Map<string, StatClaim>();
  const text = input.replace(STAT_PLACEHOLDER, (match, id: string, field?: string) => {
    const claim = findClaim(stats, id);
    if (!claim) return match;
    used.set(claim.id, claim);
    return field === 'text' ? claim.text : claim.value;
  });
  return { text, usedClaims: Array.from(used.values()) };
}
