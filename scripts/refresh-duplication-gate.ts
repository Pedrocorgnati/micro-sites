/**
 * refresh-duplication-gate — wrapper que falha refresh trimestral se duplicacao detectada.
 *
 * Encadeia:
 *   1. validate-copy-uniqueness.ts (ja existente — TASK-15 / CL-098)
 *   2. audit-content-uniqueness.ts (ja existente)
 *
 * Se threshold de similaridade > LIMITE: exit 1 (bloqueia refresh).
 *
 * TASK-22 ST002 — gap CL-595
 *
 * Usage:
 *   npx tsx scripts/refresh-duplication-gate.ts [--threshold 0.85]
 */
import { execSync } from 'node:child_process';

const THRESHOLD = (() => {
  const i = process.argv.indexOf('--threshold');
  return i >= 0 ? Number(process.argv[i + 1]) : 0.85;
})();

interface Result {
  name: string;
  ok: boolean;
  output: string;
  exitCode: number;
}

function run(cmd: string): Result {
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    return { name: cmd, ok: true, output, exitCode: 0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return {
      name: cmd,
      ok: false,
      output: (err.stdout ?? '') + (err.stderr ?? ''),
      exitCode: err.status ?? 1,
    };
  }
}

function main(): void {
  console.log(`[refresh-gate] threshold de similaridade: ${THRESHOLD}`);

  const results: Result[] = [];

  // 1. Copy uniqueness — assume que aceita --threshold
  results.push(run(`npx tsx scripts/validate-copy-uniqueness.ts --threshold ${THRESHOLD}`));

  // 2. Content uniqueness (mais granular — heading/section level)
  results.push(run('npx tsx scripts/audit-content-uniqueness.ts'));

  console.log('');
  console.log('[refresh-gate] resultados:');
  let failed = 0;
  for (const r of results) {
    const tag = r.ok ? 'OK  ' : 'FAIL';
    console.log(`  ${tag} ${r.name} (exit=${r.exitCode})`);
    if (!r.ok) {
      failed++;
      console.log(`    > ${r.output.slice(-400).trim().replace(/\n/g, '\n      ')}`);
    }
  }

  if (failed > 0) {
    console.error('');
    console.error(`[refresh-gate] FAIL — ${failed}/${results.length} checks bloquearam refresh`);
    console.error('Acoes:');
    console.error('  1. Reescrever copy duplicada apontada nos relatorios');
    console.error('  2. Re-rodar este gate para confirmar');
    console.error('  3. Apenas apos verde -> prosseguir com content refresh');
    process.exit(1);
  }

  console.log('[refresh-gate] OK — refresh trimestral pode prosseguir');
}

main();
