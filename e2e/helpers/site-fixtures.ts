/**
 * site-fixtures — fixture Playwright que serve dist/{slug} em port aleatoria.
 *
 * Usa http-server (devDep) para servir build estatico por test scope.
 * Cada test em sites.matrix.spec.ts roda contra seu proprio server,
 * evitando conflito de port em paralelo.
 *
 * TASK-17 ST001 — gap CL-311
 */
import { test as base, type TestInfo } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import path from 'node:path';
import fs from 'node:fs';

interface SiteServerHandle {
  url: string;
  slug: string;
  close: () => Promise<void>;
}

interface SiteFixtures {
  siteServer: SiteServerHandle;
}

async function waitForPort(port: number, timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await new Promise<void>((resolve, reject) => {
        const sock = createConnection({ port, host: '127.0.0.1' });
        sock.once('connect', () => {
          sock.end();
          resolve();
        });
        sock.once('error', reject);
        setTimeout(() => reject(new Error('timeout')), 1000);
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`server nao subiu em ${timeoutMs}ms`);
}

function pickPort(): number {
  // 30000-39999, com seed do PID para reduzir colisao em paralelo
  return 30_000 + Math.floor(Math.random() * 10_000) + (process.pid % 1000);
}

async function startStatic(slug: string): Promise<SiteServerHandle> {
  const distDir = path.resolve(`dist/${slug}`);
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist/${slug}/ nao existe — rodar build-site.sh ${slug} antes`);
  }
  const port = pickPort();
  const child: ChildProcess = spawn('npx', ['http-server', distDir, '-p', String(port), '-s', '-c-1'], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  await waitForPort(port);
  return {
    url: `http://localhost:${port}`,
    slug,
    close: async () => {
      child.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 100));
      if (!child.killed) child.kill('SIGKILL');
    },
  };
}

export const test = base.extend<SiteFixtures>({
  siteServer: async ({}, use, testInfo: TestInfo) => {
    // O slug vem do `describe` mais externo; usar titlePath[1] (titlePath[0] e o suite raiz)
    // Fallback: env var SITE_SLUG.
    const slug = process.env.SITE_SLUG ?? testInfo.titlePath.find((t) => /^[a-f]\d{2}-/.test(t)) ?? 'a01';
    const server = await startStatic(slug);
    try {
      await use(server);
    } finally {
      await server.close();
    }
  },
});

export const expect = test.expect;

/** Lista canonica de slugs derivada de scripts/deploy-map.sh (lazy-loaded). */
export function loadSlugs(): string[] {
  const mapFile = path.resolve('scripts/deploy-map.sh');
  if (!fs.existsSync(mapFile)) return [];
  const content = fs.readFileSync(mapFile, 'utf-8');
  const matches = content.match(/DEPLOY_MAP\["([^"]+)"\]/g) ?? [];
  return matches.map((m) => m.replace(/DEPLOY_MAP\["|"\]/g, ''));
}

/** Categoria de um slug a partir do prefixo (a01, b02, ...). */
export function categoryOf(slug: string): string {
  return slug.charAt(0).toUpperCase();
}
