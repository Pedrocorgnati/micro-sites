// src/lib/pre-build.ts
// Hook de pré-build: valida todos os configs antes de next build
// Uso: tsx src/lib/pre-build.ts (via "prebuild" em package.json)
import { validateAllConfigs } from '@/lib/content-loader';

async function preBuild() {
  console.log('[pre-build] Validando configs...');
  try {
    validateAllConfigs();
    console.log('[pre-build] ✓ Todos os configs válidos');
  } catch (err) {
    console.error('[pre-build] ✗ Erro:\n', err);
    process.exit(1);
  }
}

preBuild();
