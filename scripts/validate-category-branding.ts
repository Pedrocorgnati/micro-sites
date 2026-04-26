/**
 * validate-category-branding.ts
 * Fonte: TASK-4 intake-review (CL-322, CL-158..CL-163).
 * Falha o CI se algum site estiver com accentColor divergente da paleta canonica
 * OU sem favicon (site-especifico ou de categoria).
 */

import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_THEME_COLORS } from '../src/lib/category-theme';
import type { SiteCategory } from '../src/types';

const SITES_DIR = path.join(process.cwd(), 'sites');
const TEMPLATE_FAVICONS = path.join(SITES_DIR, '_template', 'public', 'favicons');

interface DriftEntry {
  slug: string;
  issue: string;
}

export function validateBranding(): { driftedSites: DriftEntry[] } {
  const drifted: DriftEntry[] = [];
  if (!fs.existsSync(SITES_DIR)) return { driftedSites: drifted };

  const slugs = fs.readdirSync(SITES_DIR).filter((s) => s !== '_template');

  for (const slug of slugs) {
    const cfgPath = path.join(SITES_DIR, slug, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      drifted.push({ slug, issue: 'config.json invalido' });
      continue;
    }

    const category = parsed.category as SiteCategory | undefined;
    if (!category || !(category in CATEGORY_THEME_COLORS)) {
      drifted.push({ slug, issue: `categoria ausente ou desconhecida: ${category ?? '(none)'}` });
      continue;
    }

    const expected = CATEGORY_THEME_COLORS[category];
    const current = (parsed.accentColor as string | undefined) ?? '';
    if (current.toLowerCase() !== expected.toLowerCase()) {
      drifted.push({ slug, issue: `accentColor ${current} diverge de ${expected} (cat ${category})` });
    }

    const localFavicon = path.join(SITES_DIR, slug, 'public', 'favicon.ico');
    const categoryFavicon = path.join(TEMPLATE_FAVICONS, `category-${category}.ico`);
    if (!fs.existsSync(localFavicon) && !fs.existsSync(categoryFavicon)) {
      drifted.push({ slug, issue: `favicon ausente (nem local nem de categoria ${category})` });
    }
  }

  return { driftedSites: drifted };
}

function main() {
  const r = validateBranding();
  if (r.driftedSites.length === 0) {
    console.log('OK: branding por categoria consistente');
    process.exit(0);
  }
  console.error('FAIL: divergencias de branding por categoria:');
  for (const d of r.driftedSites) console.error(`  ${d.slug}: ${d.issue}`);
  process.exit(1);
}

const isDirect = typeof require !== 'undefined'
  ? require.main === module
  : import.meta.url === `file://${process.argv[1]}`;

if (isDirect) main();
