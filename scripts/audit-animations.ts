#!/usr/bin/env tsx
/**
 * audit-animations.ts — ADR-0005 / CL-155 / TASK-3 ST003
 *
 * Varre src/** em busca de:
 *   - @keyframes
 *   - animation: ... Xms / Xs
 *   - transition: ... Xms / Xs
 *
 * Regras:
 *   - duracao > 200ms requer comentario "animation-policy-ok: <motivo>"
 *     na mesma linha ou nas 2 linhas anteriores
 *   - padroes proibidos (parallax, scroll-jack) sao sempre violacao
 *
 * Exit 1 em violacoes.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = 'src';
const EXTENSIONS = new Set(['.css', '.tsx', '.ts', '.jsx', '.js']);
const MAX_MS = 200;

// Regex que capturam duracao numerica (valor em s ou ms)
const ANIMATION_RE = /animation\s*:\s*[^;}\n]*?(\d+(?:\.\d+)?)(ms|s)/gi;
const TRANSITION_RE = /transition\s*(?:-duration)?\s*:\s*[^;}\n]*?(\d+(?:\.\d+)?)(ms|s)/gi;
const ANIM_DUR_RE = /animation-duration\s*:\s*(\d+(?:\.\d+)?)(ms|s)/gi;
const TRANS_DUR_RE = /transition-duration\s*:\s*(\d+(?:\.\d+)?)(ms|s)/gi;

const FORBIDDEN_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'parallax', re: /data-parallax|background-attachment\s*:\s*fixed/i },
  { name: 'scroll-hijack', re: /scroll-snap-type\s*:\s*[^;]*mandatory[^;]*y/i },
  { name: 'autoplay video', re: /<video[^>]*\sautoplay/i },
  { name: 'scale-excesso', re: /transform\s*:\s*scale\(\s*1\.0[6-9]|transform\s*:\s*scale\(\s*1\.[1-9]/i },
];

// Arquivos/padroes isentos (scripts, docs inline)
const EXEMPT_PATH_SUBSTRINGS = ['__tests__', 'node_modules', '.d.ts'];

type Violation = { file: string; line: number; kind: string; detail: string };
const violations: Violation[] = [];

function toMs(value: string, unit: string): number {
  const v = parseFloat(value);
  return unit === 's' ? v * 1000 : v;
}

function hasOkMarker(lines: string[], idx: number): boolean {
  for (let i = Math.max(0, idx - 2); i <= idx; i++) {
    if (lines[i]?.includes('animation-policy-ok:')) return true;
  }
  return false;
}

function auditDurations(filePath: string, content: string): void {
  const lines = content.split(/\r?\n/);

  const scan = (re: RegExp, kind: string) => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        const ms = toMs(m[1], m[2]);
        if (ms > MAX_MS) {
          if (hasOkMarker(lines, i)) continue;
          violations.push({
            file: filePath,
            line: i + 1,
            kind,
            detail: `${ms}ms > ${MAX_MS}ms sem marker "animation-policy-ok:"`,
          });
        }
      }
    }
  };

  scan(ANIMATION_RE, 'animation-duration');
  scan(TRANSITION_RE, 'transition-duration');
  scan(ANIM_DUR_RE, 'animation-duration (explicit)');
  scan(TRANS_DUR_RE, 'transition-duration (explicit)');
}

function auditForbidden(filePath: string, content: string): void {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const { name, re } of FORBIDDEN_PATTERNS) {
      if (re.test(lines[i])) {
        violations.push({
          file: filePath,
          line: i + 1,
          kind: `forbidden:${name}`,
          detail: lines[i].trim().slice(0, 120),
        });
      }
    }
  }
}

function walk(dir: string): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(process.cwd(), p);
    if (EXEMPT_PATH_SUBSTRINGS.some((s) => rel.includes(s))) continue;
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (EXTENSIONS.has(extname(name))) {
      const content = readFileSync(p, 'utf-8');
      auditDurations(rel, content);
      auditForbidden(rel, content);
    }
  }
}

walk(ROOT);

if (violations.length === 0) {
  console.log('[audit-animations] OK — 0 violacoes (ADR-0005)');
  process.exit(0);
}

console.error(`[audit-animations] FALHA — ${violations.length} violacoes:`);
const byFile = new Map<string, Violation[]>();
for (const v of violations) {
  const arr = byFile.get(v.file) ?? [];
  arr.push(v);
  byFile.set(v.file, arr);
}
for (const [file, items] of byFile) {
  console.error(`  ${file}`);
  for (const v of items) {
    console.error(`    L${v.line} [${v.kind}] ${v.detail}`);
  }
}
console.error('\nDica: adicione comentario "animation-policy-ok: <motivo>" na linha ou 2 linhas acima para justificar duracao > 200ms.');
process.exit(1);
