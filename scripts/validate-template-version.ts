#!/usr/bin/env tsx
/**
 * validate-template-version.ts
 * Compara o major de `templateVersion` em cada sites/{slug}/config.json
 * contra o `_template/config.json`. Emite alerta se drift >= 1 major.
 *
 * Gap coberto: CL-339 (versionamento _template).
 * Exit 1 em drift crítico (>= 1 major atrás).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SITES_DIR = path.resolve(process.cwd(), 'sites');
const TEMPLATE_CFG = path.join(SITES_DIR, '_template/config.json');

type Cfg = { templateVersion?: string; slug?: string };

function parseMajor(v?: string): number {
  if (!v) return -1;
  const m = /^(\d+)\./.exec(v);
  return m ? parseInt(m[1], 10) : -1;
}

async function readJson<T>(p: string): Promise<T> {
  return JSON.parse(await fs.readFile(p, 'utf8')) as T;
}

async function main() {
  const template = await readJson<Cfg>(TEMPLATE_CFG);
  const tplMajor = parseMajor(template.templateVersion);
  if (tplMajor < 0) {
    console.error('[validate-template-version] _template/config.json sem templateVersion.');
    process.exit(1);
  }

  const entries = await fs.readdir(SITES_DIR, { withFileTypes: true });
  const drifts: string[] = [];
  const missing: string[] = [];

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('_')) continue;
    const cfgPath = path.join(SITES_DIR, e.name, 'config.json');
    try {
      const cfg = await readJson<Cfg>(cfgPath);
      if (!cfg.templateVersion) {
        missing.push(e.name);
        continue;
      }
      const siteMajor = parseMajor(cfg.templateVersion);
      if (tplMajor - siteMajor >= 1) {
        drifts.push(`${e.name}: site=${cfg.templateVersion} vs template=${template.templateVersion}`);
      }
    } catch {
      missing.push(e.name);
    }
  }

  if (missing.length > 0) {
    console.error('[validate-template-version] sites sem templateVersion:');
    missing.forEach((m) => console.error(' -', m));
  }
  if (drifts.length > 0) {
    console.error('[validate-template-version] drift crítico:');
    drifts.forEach((d) => console.error(' -', d));
  }

  if (missing.length > 0 || drifts.length > 0) process.exit(1);
  console.log(`[validate-template-version] OK — template=${template.templateVersion}`);
}

main().catch((err) => {
  console.error('[validate-template-version] erro:', err);
  process.exit(1);
});
