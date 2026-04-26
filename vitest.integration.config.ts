import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/integration/**/*.integration.test.ts'],
    testTimeout: 30000,
    // Testes de integração rodam sequencialmente (leitura de filesystem compartilhado)
    // Para Vitest 4.x, use workspace ou configure em vitest.config.ts
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
