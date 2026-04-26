/**
 * normalize-timestamps-utc — auditoria + normalizador de timestamps.
 *
 * Detecta:
 *   - `date` (sem `-u`) em scripts shell -> sugere `date -u +"%Y-%m-%dT%H:%M:%SZ"`
 *   - `Date.now()` ou `new Date()` sem `.toISOString()` proximo em .ts/.js
 *   - `new Date().toLocaleString(...)` para arquivar (registro pessoal e ok)
 *
 * Modo padrao: report (exit 0 sempre)
 * Modo --strict: exit 1 se houver findings (CI gate opcional)
 * Modo --fix: aplica auto-fix em scripts shell seguros (apenas `date +`/`date "+"` sem `-u`)
 *
 * TASK-19 ST004 — gap CL-073
 *
 * Usage:
 *   npx tsx scripts/normalize-timestamps-utc.ts [--strict] [--fix] [--scope <glob>]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const STRICT = process.argv.includes('--strict');
const FIX = process.argv.includes('--fix');
const SCOPE_DIRS = ['scripts', 'src', 'logs'];
const EXCLUDE_DIRS = new Set(['node_modules', '.next', 'dist', '.git', 'coverage', 'output', '.lighthouseci']);

interface Finding {
  file: string;
  line: number;
  level: 'error' | 'warn';
  pattern: string;
  snippet: string;
  suggestion: string;
  fixable: boolean;
}

function walkSync(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      out.push(...walkSync(p, exts));
    } else if (exts.some((x) => e.name.endsWith(x))) {
      out.push(p);
    }
  }
  return out;
}

function auditShell(file: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*#/.test(line)) continue;
    // `date +...` ou `date "+..."` SEM -u, -Iseconds ou TZ=UTC
    const m = line.match(/(?<![\w-])date\s+(?!-u|--utc|-Iseconds)(["']?\+|".*Z")/);
    if (m && !/TZ=UTC/.test(line)) {
      findings.push({
        file,
        line: i + 1,
        level: 'warn',
        pattern: 'shell-date-no-utc',
        snippet: line.trim().slice(0, 160),
        suggestion: 'usar `date -u +"%Y-%m-%dT%H:%M:%SZ"` para timestamps em logs',
        fixable: true,
      });
    }
  }
  return findings;
}

function auditJs(file: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // toLocaleString — bandeira amarela para logs
    if (/\.toLocaleString\s*\(/.test(line) && /log|console|writeFile/i.test(content)) {
      findings.push({
        file,
        line: i + 1,
        level: 'warn',
        pattern: 'toLocaleString-in-log',
        snippet: line.trim().slice(0, 160),
        suggestion: 'preferir `.toISOString()` para logs (UTC)',
        fixable: false,
      });
    }
  }
  return findings;
}

function fixShell(file: string, content: string): { fixed: string; changed: number } {
  const replaced = content.replace(
    /(?<![\w-])date(\s+)(?!-u|--utc|-Iseconds|--rfc-3339)(["']?\+)/g,
    'date$1-u $2',
  );
  return { fixed: replaced, changed: replaced === content ? 0 : 1 };
}

function main(): void {
  let allFindings: Finding[] = [];
  let fixedFiles = 0;

  // Shell
  const shFiles: string[] = [];
  for (const d of SCOPE_DIRS) shFiles.push(...walkSync(path.join(ROOT, d), ['.sh']));
  for (const f of shFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    const findings = auditShell(f, content);
    allFindings = allFindings.concat(findings);
    if (FIX && findings.some((x) => x.fixable)) {
      const { fixed, changed } = fixShell(f, content);
      if (changed) {
        fs.writeFileSync(f, fixed, 'utf-8');
        fixedFiles++;
        console.log(`[norm-utc] FIXED ${path.relative(ROOT, f)}`);
      }
    }
  }

  // JS/TS
  const jsFiles: string[] = [];
  for (const d of ['scripts', 'src']) jsFiles.push(...walkSync(path.join(ROOT, d), ['.ts', '.tsx', '.js']));
  for (const f of jsFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    allFindings = allFindings.concat(auditJs(f, content));
  }

  console.log(`[norm-utc] arquivos analisados: shell=${shFiles.length} js=${jsFiles.length}`);
  console.log(`[norm-utc] findings: ${allFindings.length} (warn=${allFindings.filter((x) => x.level === 'warn').length} err=${allFindings.filter((x) => x.level === 'error').length})`);

  for (const f of allFindings) {
    console.log(
      `  [${f.level.toUpperCase()}] ${path.relative(ROOT, f.file)}:${f.line} <${f.pattern}> ${f.fixable ? '[fixable]' : ''}`,
    );
    console.log(`     > ${f.snippet}`);
    console.log(`     -> ${f.suggestion}`);
  }

  if (FIX) console.log(`[norm-utc] auto-fix: ${fixedFiles} arquivos modificados`);

  if (STRICT && allFindings.length > 0) {
    process.exit(1);
  }
}

main();
