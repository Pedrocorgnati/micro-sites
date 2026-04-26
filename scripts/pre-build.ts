#!/usr/bin/env tsx
/**
 * Orchestrator de pre-build: valida configs + artigos + gera índices.
 * Executa automaticamente antes do `next build` via npm `prebuild` hook.
 * Fonte: TASK-1 ST003 (module-11-blog-pipeline)
 */
import { execSync } from 'child_process';

// ── 1. Validação de site configs ─────────────────────────────
console.log('🔧 [1/3] Validando configurações dos sites...');
try {
  execSync('npx tsx src/lib/pre-build.ts', { stdio: 'inherit' });
  console.log('✅ Configs válidas\n');
} catch {
  console.error('❌ Configs inválidas. Abortando build.\n');
  process.exit(1);
}

// ── 2. Validação de frontmatter + word count dos artigos ──────
console.log('📝 [2/3] Validando frontmatter e word count de artigos...');
try {
  execSync('npx tsx scripts/validate-articles.ts', { stdio: 'inherit' });
  console.log('✅ Artigos válidos\n');
} catch {
  console.error('❌ Validação de artigos falhou. Abortando build.\n');
  process.exit(1);
}

// ── 3. Geração de índices para Fuse.js search ─────────────────
console.log('📊 [3/3] Gerando índices de blog para search...');
try {
  execSync('npx tsx scripts/generate-blog-index.ts', { stdio: 'inherit' });
  console.log('✅ Índices gerados\n');
} catch {
  // Não-bloqueante: índices são nice-to-have
  console.warn('⚠️  Geração de índices falhou (não-bloqueante). Continuando build...\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Pre-build OK — Pronto para `next build`');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
process.exit(0);
