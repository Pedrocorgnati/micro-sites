#!/usr/bin/env tsx
/**
 * scripts/branch-cleanup.ts (CL-070, CL-528-529)
 * Lista e arquiva branches deploy-NN sem commits ha >90 dias.
 *
 * Uso:
 *   npx tsx scripts/branch-cleanup.ts                # dry-run (default)
 *   npx tsx scripts/branch-cleanup.ts --apply        # arquiva (cria tag) + deleta
 *   npx tsx scripts/branch-cleanup.ts --threshold 60 # 60 dias em vez de 90
 *
 * Politica:
 *   1. Antes de deletar, cria tag archive/{branch}-{YYYY-MM} para preservar historico.
 *   2. Tags archive/* nao sao apagadas — sempre recuperaveis via `git checkout archive/...`.
 */
import { execSync } from 'node:child_process';

interface BranchInfo {
  name: string;
  lastCommitDate: Date;
  ageDays: number;
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const thresholdIdx = args.indexOf('--threshold');
const thresholdDays = thresholdIdx >= 0 ? parseInt(args[thresholdIdx + 1] ?? '90', 10) : 90;

function sh(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function listDeployBranches(): BranchInfo[] {
  const raw = sh('git for-each-ref --sort=-committerdate refs/remotes/origin/deploy-* --format=%(refname:short)|%(committerdate:iso8601)');
  if (!raw) return [];
  return raw.split('\n').map((line) => {
    const [refname, dateStr] = line.split('|');
    const name = refname.replace(/^origin\//, '');
    const lastCommitDate = new Date(dateStr);
    const ageDays = Math.floor((Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24));
    return { name, lastCommitDate, ageDays };
  });
}

function archiveTag(branchName: string): string {
  const yyyymm = new Date().toISOString().slice(0, 7);
  return `archive/${branchName}-${yyyymm}`;
}

const branches = listDeployBranches();
const stale = branches.filter((b) => b.ageDays >= thresholdDays);

console.log(`[branch-cleanup] threshold=${thresholdDays}d apply=${apply}`);
console.log(`[branch-cleanup] total=${branches.length} stale=${stale.length}`);

if (stale.length === 0) {
  console.log('[branch-cleanup] Nenhuma branch deploy-* qualificada.');
  process.exit(0);
}

console.log();
console.log('Branches qualificadas para arquivamento:');
console.log('-'.repeat(72));
console.log('Branch'.padEnd(36) + 'Ultimo commit'.padEnd(22) + 'Idade');
console.log('-'.repeat(72));
for (const b of stale) {
  const tag = archiveTag(b.name);
  console.log(b.name.padEnd(36) + b.lastCommitDate.toISOString().slice(0, 10).padEnd(22) + `${b.ageDays}d -> ${tag}`);
}
console.log();

if (!apply) {
  console.log('[dry-run] Re-rode com --apply para arquivar (cria tag + deleta remote).');
  process.exit(0);
}

for (const b of stale) {
  const tag = archiveTag(b.name);
  console.log(`[apply] Arquivando ${b.name} -> ${tag}`);
  try {
    sh(`git tag -a ${tag} origin/${b.name} -m "Archive of ${b.name} (auto, age=${b.ageDays}d)"`);
    sh(`git push origin ${tag}`);
    sh(`git push origin --delete ${b.name}`);
  } catch (err) {
    console.error(`[apply] FAIL em ${b.name}:`, (err as Error).message);
  }
}
console.log('[branch-cleanup] Concluido.');
