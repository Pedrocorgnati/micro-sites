// src/integration/helpers/fixtures.ts
// Helpers e fixtures reutilizáveis para testes de integração
// Nota: sem mocks de filesystem — testes usam dados reais + tmp dirs para erros

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { SiteConfig, BlogArticle, SiteCategory } from '@/types';

// ─── Slugs reais disponíveis em sites/ ───────────────────────────────────────

/** Site Cat.D com blog, leadMagnet — config.json 100% válido */
export const SLUG_D01 = 'd01-calculadora-custo-site';

/** Site Cat.C — config.json com schema "Service" (inválido no enum Zod) */
export const SLUG_C01 = 'c01-site-institucional-pme';

// ─── Factory: SiteConfig mínimo válido ───────────────────────────────────────

export function buildMinimalConfig(
  category: SiteCategory = 'C',
  overrides: Partial<SiteConfig> = {},
): SiteConfig {
  return {
    slug: 'c01-site-institucional-pme',
    name: 'Empresa Teste',
    category,
    accentColor: '#059669',
    wave: 1,
    funnelStage: 'consideration',
    template: 'landing',
    hasBlog: false,
    schema: ['Organization', 'FAQPage'],
    seo: {
      title: 'Título do Site Teste',
      description: 'Descrição com mais de 50 chars para passar na validação básica aqui.',
      keywords: ['keyword1', 'keyword2'],
    },
    cta: {
      primaryLabel: 'Contratar',
      formEndpoint: 'https://api.staticforms.xyz/submit',
      whatsappNumber: '5511987654321',
      whatsappMessage: 'Olá! Tenho interesse.',
    },
    contactEmail: 'qa@forjadesistemas.com.br',
    ...overrides,
  };
}

export function buildCatDConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return buildMinimalConfig('D', {
    slug: 'd01-calculadora-custo-site',
    category: 'D',
    accentColor: '#7C3AED',
    template: 'calculator',
    schema: ['Organization', 'FAQPage', 'HowTo'],
    leadMagnet: {
      enabled: true,
      type: 'calculator',
      partialResultLabel: 'Seu orçamento estimado',
      fullResultPath: '/resultado',
    },
    hasBlog: true,
    ...overrides,
  });
}

export function buildBlogArticle(overrides: Partial<BlogArticle> = {}): BlogArticle {
  return {
    slug: 'artigo-de-teste',
    title: 'Artigo de Teste para Integração',
    description: 'Descrição do artigo de teste com conteúdo suficiente para validação.',
    author: 'SystemForge',
    date: '2026-04-10',
    tags: ['teste', 'integração'],
    body: '<p>Conteúdo do artigo de teste.</p>',
    ...overrides,
  };
}

// ─── Helpers de filesystem temporário ────────────────────────────────────────

/**
 * Cria diretório temporário isolado por teste.
 * Retorna o path e uma função cleanup.
 */
export function createTempSitesDir(): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'micro-sites-test-'));
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

/**
 * Escreve um config.json em tmpDir/sites/{slug}/config.json
 */
export function writeTempConfig(sitesDir: string, slug: string, config: object): void {
  const siteDir = path.join(sitesDir, slug);
  fs.mkdirSync(siteDir, { recursive: true });
  fs.writeFileSync(path.join(siteDir, 'config.json'), JSON.stringify(config, null, 2));
}

/**
 * Escreve um arquivo markdown em tmpDir/sites/{slug}/content/{filename}
 */
export function writeTempContent(
  sitesDir: string,
  slug: string,
  filename: string,
  content: string,
): void {
  const contentDir = path.join(sitesDir, slug, 'content');
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, filename), content);
}

/**
 * Escreve um artigo de blog em tmpDir/sites/{slug}/blog/{filename}
 */
export function writeTempBlogArticle(
  sitesDir: string,
  slug: string,
  filename: string,
  content: string,
): void {
  const blogDir = path.join(sitesDir, slug, 'blog');
  fs.mkdirSync(blogDir, { recursive: true });
  fs.writeFileSync(path.join(blogDir, filename), content);
}

// ─── Config mínimo serializado (pronto para JSON.stringify) ─────────────────

export const VALID_CONFIG_JSON = {
  slug: 'd01-calculadora-custo-site',
  name: 'Site Teste Integração',
  category: 'D',
  accentColor: '#7C3AED',
  wave: 1,
  funnelStage: 'consideration',
  template: 'calculator',
  hasBlog: true,
  schema: ['Organization', 'FAQPage'],
  seo: {
    title: 'Título de Teste — Integração',
    description: 'Descrição do site de teste criado para validação de integração com dados reais.',
    keywords: ['teste', 'integração'],
  },
  cta: {
    primaryLabel: 'Calcular',
    formEndpoint: 'https://api.staticforms.xyz/submit',
    whatsappNumber: '5511987654321',
    whatsappMessage: 'Quero calcular o custo do meu site.',
  },
  contactEmail: 'qa@forjadesistemas.com.br',
  leadMagnet: {
    enabled: true,
    type: 'calculator',
    partialResultLabel: 'Seu orçamento',
    fullResultPath: '/resultado',
  },
  showSystemForgeLogo: true,
};
