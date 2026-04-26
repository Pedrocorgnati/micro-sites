#!/usr/bin/env tsx
/**
 * Lighthouse Gate — escolhe config correta baseado na categoria do site
 * e roda `lhci autorun` contra dist/{slug}/. Exit 1 se falhar.
 *
 * Uso:
 *   tsx scripts/lighthouse-gate.ts <slug>
 *   tsx scripts/lighthouse-gate.ts d01-calculadora-custo-site
 *
 * Thresholds:
 *   A/B/C/E/F → lighthouserc.json (perf 95+, INP implicito via TBT)
 *   D         → lighthouserc-d.json (perf 85+, INP<200ms)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * CL-253 — Thresholds oficiais Lighthouse (ADR-0007).
 * Cat. A/B/C/E/F: perf 95, a11y 95, best-practices 90, seo 95
 * Cat. D:        perf 85 (INP<200ms), a11y 95, best-practices 90, seo 95
 * Mantidos em sincronia com lighthouserc.json e lighthouserc-d.json.
 */
export const LIGHTHOUSE_THRESHOLDS = {
  default: { performance: 95, accessibility: 95, bestPractices: 90, seo: 95 },
  categoryD: { performance: 85, accessibility: 95, bestPractices: 90, seo: 95, inpMs: 200 },
} as const;

const WORKSPACE = process.cwd();
const SLUG = process.argv[2];

if (!SLUG) {
  console.error("[lighthouse-gate] Uso: tsx scripts/lighthouse-gate.ts <slug>");
  process.exit(2);
}

const siteDir = path.join(WORKSPACE, "sites", SLUG);
const configPath = path.join(siteDir, "config.json");

if (!fs.existsSync(configPath)) {
  console.error(`[lighthouse-gate] sites/${SLUG}/config.json nao encontrado`);
  process.exit(2);
}

const siteConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const category: string =
  siteConfig.category ?? SLUG.charAt(0).toUpperCase();

const distDir = path.join(WORKSPACE, "dist", SLUG);
if (!fs.existsSync(distDir)) {
  console.error(`[lighthouse-gate] dist/${SLUG}/ nao encontrado — rode build antes`);
  process.exit(2);
}

const baseRc =
  category.toUpperCase() === "D" ? "lighthouserc-d.json" : "lighthouserc.json";

const template = JSON.parse(fs.readFileSync(path.join(WORKSPACE, baseRc), "utf8"));
template.ci.collect.staticDistDir = `./dist/${SLUG}`;

const tmpRc = path.join(WORKSPACE, `.lighthouserc.${SLUG}.json`);
fs.writeFileSync(tmpRc, JSON.stringify(template, null, 2));

const activeThresholds =
  category.toUpperCase() === "D"
    ? LIGHTHOUSE_THRESHOLDS.categoryD
    : LIGHTHOUSE_THRESHOLDS.default;

console.log(
  `[lighthouse-gate] slug=${SLUG} category=${category} config=${baseRc} dist=dist/${SLUG}`,
);
console.log(
  `[lighthouse-gate] thresholds=${JSON.stringify(activeThresholds)} (ADR-0007)`,
);

try {
  execSync(`npx lhci autorun --config=${tmpRc}`, {
    stdio: "inherit",
    cwd: WORKSPACE,
  });
  console.log(`[lighthouse-gate] PASS ${SLUG}`);
  process.exit(0);
} catch (err) {
  console.error(
    `[lighthouse-gate] FAIL ${SLUG} — thresholds violados (${JSON.stringify(activeThresholds)}). ` +
      `Checar relatorio em .lighthouseci/ e corrigir antes do merge. Ver ADR-0007.`,
  );
  process.exit(1);
} finally {
  try {
    fs.unlinkSync(tmpRc);
  } catch {}
}
