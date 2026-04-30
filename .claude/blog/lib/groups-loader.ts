/**
 * Blog Daily — Groups loader + hash validator.
 *
 * Carrega .claude/blog/data/global/groups.json e valida que o hash bate
 * com config.expected_groups_hash. Se nao bater, abortar — mapping foi
 * alterado fora do fluxo controlado de PR + bump de version.
 *
 * Uso:
 *   import { loadGroups, validateGroupsIntegrity } from './groups-loader';
 *   const groups = loadGroups();
 *   validateGroupsIntegrity(); // throws se hash mismatch ou estrutura invalida
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type GroupId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6';

export interface GroupConfig {
  id: GroupId;
  name: string;
  ymyl: boolean;
  hubSlug: string;
  siteSlugs: string[];
  editorialCharter: string;
  vocabulary: string[];
  ctaPattern: string;
  qualityFloor: number;
  newsRelevanceCriteria: string[];
  outboundLinkPolicy?: string;
  rationale: string;
}

export interface GroupsManifest {
  version: string;
  generated_at: string;
  purpose: string;
  groups_count: number;
  sites_count: number;
  groups: GroupConfig[];
}

export interface BlogConfig {
  version: string;
  market: { locale: string; currency: string; country: string };
  routine: {
    stories_per_run: number;
    sites_per_story: number;
    total_articles_per_run: number;
    max_attempts_per_job: number;
    schedule_hint_utc: string;
  };
  quality: {
    default_threshold: number;
    ymyl_threshold: number;
    spoke_min_threshold: number;
    min_word_count_hub: number;
    min_word_count_spoke: number;
    max_word_count_spoke: number;
  };
  anti_duplicate: Record<string, unknown>;
  topic_strategy: Record<string, unknown>;
  boundaries: { allowed_write_paths: string[]; forbidden_write_paths: string[] };
  expected_groups_hash: string;
  services: Record<string, string>;
}

// __dirname = .../{repo}/.claude/blog/lib  →  3 levels up reaches repo root.
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG_PATH = path.join(REPO_ROOT, '.claude', 'blog', 'config.json');
const GROUPS_PATH = path.join(REPO_ROOT, '.claude', 'blog', 'data', 'global', 'groups.json');

export class GroupsIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroupsIntegrityError';
  }
}

/** Le config.json do blog. Throws se ausente/invalido. */
export function loadConfig(): BlogConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new GroupsIntegrityError(`config.json ausente em ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw) as BlogConfig;
}

/** Le groups.json. Throws se ausente/invalido. */
export function loadGroups(): GroupsManifest {
  if (!fs.existsSync(GROUPS_PATH)) {
    throw new GroupsIntegrityError(`groups.json ausente em ${GROUPS_PATH}`);
  }
  const raw = fs.readFileSync(GROUPS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as GroupsManifest;
  if (!Array.isArray(parsed.groups) || parsed.groups.length !== 6) {
    throw new GroupsIntegrityError(
      `groups.json invalido: esperado 6 grupos, recebido ${parsed.groups?.length ?? 'undefined'}`,
    );
  }
  return parsed;
}

/**
 * SHA-256 do conteudo do groups.json com EOL normalizado para LF.
 * Garante hash estavel cross-platform (Windows/Linux/Mac com core.autocrlf).
 * `.gitattributes` deve fixar `eol=lf` para esse arquivo como defesa-em-profundidade.
 */
export function computeGroupsHash(): string {
  const raw = fs.readFileSync(GROUPS_PATH, 'utf8');
  const normalized = raw.replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Valida integridade completa: hash bate, 6 grupos, 6 sites por grupo, sem
 * duplicacao de slugs entre grupos, hubSlug presente em siteSlugs.
 */
export function validateGroupsIntegrity(): void {
  const config = loadConfig();
  const groups = loadGroups();

  // 1. Hash check
  const actualHash = computeGroupsHash();
  if (actualHash !== config.expected_groups_hash) {
    throw new GroupsIntegrityError(
      `Hash mismatch: groups.json foi alterado fora do fluxo.\n` +
      `  expected: ${config.expected_groups_hash}\n` +
      `  actual:   ${actualHash}\n` +
      `Para alterar mapping: PR com bump de version + recompute de hash via sha256sum.`,
    );
  }

  // 2. Count check (array + headers parity)
  if (groups.groups.length !== 6) {
    throw new GroupsIntegrityError(`Esperado 6 grupos, encontrado ${groups.groups.length}`);
  }
  if (groups.groups_count !== 6) {
    throw new GroupsIntegrityError(`Header groups_count=${groups.groups_count} stale (esperado 6)`);
  }
  if (groups.sites_count !== 36) {
    throw new GroupsIntegrityError(`Header sites_count=${groups.sites_count} stale (esperado 36)`);
  }

  // 2b. IDs unicos e exatamente {G1..G6}
  const expectedIds: GroupId[] = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
  const actualIds = groups.groups.map((g) => g.id).sort();
  const expectedSorted = [...expectedIds].sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedSorted)) {
    throw new GroupsIntegrityError(
      `IDs de grupo invalidos. Esperado ${expectedSorted.join(',')}; recebido ${actualIds.join(',')}`,
    );
  }

  // 3. Cada grupo tem 6 sites
  for (const g of groups.groups) {
    if (g.siteSlugs.length !== 6) {
      throw new GroupsIntegrityError(
        `Grupo ${g.id} tem ${g.siteSlugs.length} sites (esperado 6)`,
      );
    }
    if (!g.siteSlugs.includes(g.hubSlug)) {
      throw new GroupsIntegrityError(
        `Grupo ${g.id} hubSlug ${g.hubSlug} nao esta em siteSlugs`,
      );
    }
  }

  // 4. Sem duplicacao de slug entre grupos
  const allSlugs = groups.groups.flatMap((g) => g.siteSlugs);
  const uniqueSlugs = new Set(allSlugs);
  if (allSlugs.length !== uniqueSlugs.size) {
    const dupes = allSlugs.filter((s, i) => allSlugs.indexOf(s) !== i);
    throw new GroupsIntegrityError(
      `Slugs duplicados entre grupos: ${[...new Set(dupes)].join(', ')}`,
    );
  }

  // 5. Total = 36
  if (allSlugs.length !== 36) {
    throw new GroupsIntegrityError(
      `Total de sites = ${allSlugs.length}, esperado 36`,
    );
  }
}

/** Retorna o grupo de um slug. */
export function findGroupBySlug(slug: string): GroupConfig | null {
  const { groups } = loadGroups();
  return groups.find((g) => g.siteSlugs.includes(slug)) ?? null;
}

/** Retorna config de grupo por id. */
export function getGroup(id: GroupId): GroupConfig {
  const { groups } = loadGroups();
  const g = groups.find((x) => x.id === id);
  if (!g) throw new GroupsIntegrityError(`Grupo ${id} nao encontrado`);
  return g;
}

/** Retorna o slug do hub de um grupo. */
export function getHubSlug(groupId: GroupId): string {
  return getGroup(groupId).hubSlug;
}

/** Retorna os 5 slugs spokes de um grupo (excluindo o hub). */
export function getSpokeSlugs(groupId: GroupId): string[] {
  const g = getGroup(groupId);
  return g.siteSlugs.filter((s) => s !== g.hubSlug);
}
