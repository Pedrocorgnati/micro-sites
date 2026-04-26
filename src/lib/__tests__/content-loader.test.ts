// src/lib/__tests__/content-loader.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadSiteConfig,
  validateAllConfigs,
  loadPageContent,
  loadBlogArticles,
  getAllSlugs,
} from '../content-loader';

const TEST_SITES_DIR = path.join(process.cwd(), 'sites');
const TEST_SLUG = '_test-content-loader';
const TEST_SITE_DIR = path.join(TEST_SITES_DIR, TEST_SLUG);

const VALID_CONFIG = {
  slug: 'c01-site-institucional-pme',
  name: 'Site Institucional PME',
  category: 'C',
  accentColor: '#059669',
  wave: 1,
  funnelStage: 'consideration',
  template: 'landing',
  hasBlog: false,
  schema: ['Organization', 'FAQPage'],
  seo: {
    title: 'Site Profissional para Pequenas Empresas',
    description: 'Criamos sites profissionais para pequenas e médias empresas com foco em conversão.',
    keywords: ['site empresarial', 'site pme'],
  },
  cta: {
    primaryLabel: 'Solicitar Orçamento',
    formEndpoint: 'https://api.staticforms.xyz/submit/TOKEN',
    whatsappNumber: '5511987654321',
    whatsappMessage: 'Olá! Vim pelo site.',
  },
  contactEmail: 'qa@forjadesistemas.com.br',
};

beforeAll(() => {
  // Setup: criar site de teste com config válido
  fs.mkdirSync(path.join(TEST_SITE_DIR, 'content'), { recursive: true });
  // loadBlogArticles le de blog/articles/ — usar mesmo caminho aqui
  fs.mkdirSync(path.join(TEST_SITE_DIR, 'blog', 'articles'), { recursive: true });
  fs.writeFileSync(
    path.join(TEST_SITE_DIR, 'config.json'),
    JSON.stringify(VALID_CONFIG)
  );
});

afterAll(() => {
  // Cleanup
  fs.rmSync(TEST_SITE_DIR, { recursive: true, force: true });
});

// ── loadSiteConfig ──────────────────────────────────────────

describe('loadSiteConfig', () => {
  it('[SUCCESS] retorna SiteConfig quando config válido', () => {
    const config = loadSiteConfig(TEST_SLUG);
    expect(config.name).toBe('Site Institucional PME');
    expect(config.category).toBe('C');
  });

  it('[ERROR] BUILD_001 — slug não existe', () => {
    expect(() => loadSiteConfig('zzz-nao-existe')).toThrow('[BUILD_001]');
    expect(() => loadSiteConfig('zzz-nao-existe')).toThrow('Config não encontrado');
  });

  it('[ERROR] BUILD_001 — config com campo inválido', () => {
    const invalidDir = path.join(TEST_SITES_DIR, '_test-invalid-config');
    fs.mkdirSync(invalidDir, { recursive: true });
    fs.writeFileSync(
      path.join(invalidDir, 'config.json'),
      JSON.stringify({ slug: 'd01-calculadora-custo-site', template: 'invalid_template' })
    );

    try {
      expect(() => loadSiteConfig('_test-invalid-config')).toThrow('[BUILD_001]');
    } finally {
      fs.rmSync(invalidDir, { recursive: true, force: true });
    }
  });
});

// ── validateAllConfigs ───────────────────────────────────────

describe('validateAllConfigs', () => {
  it('[SUCCESS] agrega erros de múltiplos configs inválidos', () => {
    // Nao usar prefixo `_` pois getAllSlugs filtra dirs com `_`/`.`
    const dirs = ['zzz-bad-1', 'zzz-bad-2'].map((n) =>
      path.join(TEST_SITES_DIR, n)
    );

    dirs.forEach((dir) => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ bad: true }));
    });

    try {
      let threw = false;
      try {
        validateAllConfigs();
      } catch (err) {
        threw = true;
        expect(String(err)).toContain('[BUILD_001]');
        // Deve conter pelo menos 2 erros listados
        const matches = String(err).match(/\[BUILD_001\]/g);
        expect(matches!.length).toBeGreaterThanOrEqual(2);
      }
      expect(threw).toBe(true);
    } finally {
      dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
    }
  });
});

// ── getAllSlugs ───────────────────────────────────────────────

describe('getAllSlugs', () => {
  it('[DEGRADED] exclui pasta oculta .template', () => {
    const slugs = getAllSlugs();
    expect(slugs).not.toContain('.template');
    expect(slugs.every((s) => !s.startsWith('.'))).toBe(true);
  });

  it('[SUCCESS] retorna apenas diretórios (exclui prefixo _)', () => {
    const slugs = getAllSlugs();
    expect(Array.isArray(slugs)).toBe(true);
    expect(slugs.length).toBeGreaterThan(0);
    // Dirs com prefixo _ são excluídos (mesma lógica dos ocultos com .)
    expect(slugs).not.toContain(TEST_SLUG);
    expect(slugs.every((s) => !s.startsWith('_'))).toBe(true);
    // Um slug real conhecido deve estar presente
    expect(slugs).toContain('d01-calculadora-custo-site');
  });
});

// ── loadPageContent ──────────────────────────────────────────

describe('loadPageContent', () => {
  it('[SUCCESS] carrega markdown e retorna HTML sanitizado', async () => {
    fs.writeFileSync(
      path.join(TEST_SITE_DIR, 'content', 'hero.md'),
      '---\nheadline: Teste\n---\n# Título\nTexto de conteúdo.'
    );

    const page = await loadPageContent(TEST_SLUG, 'hero.md');
    expect(page.frontmatter.headline).toBe('Teste');
    expect(page.body).toContain('Título');
    expect(page.body).toContain('Texto de conteúdo');
  });

  it('[EDGE] XSS via markdown é sanitizado', async () => {
    fs.writeFileSync(
      path.join(TEST_SITE_DIR, 'content', 'xss.md'),
      '---\n---\n<script>alert(1)</script>\nTexto seguro.'
    );

    const page = await loadPageContent(TEST_SLUG, 'xss.md');
    expect(page.body).not.toContain('<script>');
    expect(page.body).not.toContain('alert(1)');
  });

  it('[ERROR] BUILD_003 — arquivo não existe', async () => {
    await expect(loadPageContent(TEST_SLUG, 'nao-existe.md')).rejects.toThrow('[BUILD_003]');
  });
});

// ── loadBlogArticles ─────────────────────────────────────────

describe('loadBlogArticles', () => {
  it('[SUCCESS] carrega artigos e ordena por data decrescente', async () => {
    // Usa TEST_SLUG (pasta isolada criada no beforeAll) para não interferir em conteúdo real
    const blogDir = path.join(TEST_SITE_DIR, 'blog', 'articles');

    fs.writeFileSync(
      path.join(blogDir, 'artigo-antigo.md'),
      '---\nslug: artigo-antigo\ntitle: Artigo Antigo com Título Completo Aqui\ndescription: Descrição do artigo antigo que deve ter ao menos 50 caracteres para validar.\ndate: 2024-01-01\nauthor: Pedro\n---\nConteúdo antigo.'
    );
    fs.writeFileSync(
      path.join(blogDir, 'artigo-novo.md'),
      '---\nslug: artigo-novo\ntitle: Artigo Novo com Título Bem Completo\ndescription: Descrição do artigo novo que deve ter ao menos 50 caracteres para validar o schema.\ndate: 2024-06-01\nauthor: Pedro\n---\nConteúdo novo.'
    );

    const articles = await loadBlogArticles(TEST_SLUG);
    expect(articles[0].date).toBe('2024-06-01');
    expect(articles[1].date).toBe('2024-01-01');

    // Cleanup apenas dos arquivos de teste (não remove a pasta — afterAll cuida disso)
    fs.rmSync(path.join(blogDir, 'artigo-antigo.md'), { force: true });
    fs.rmSync(path.join(blogDir, 'artigo-novo.md'), { force: true });
  });

  it('[SUCCESS] retorna [] quando pasta blog não existe', async () => {
    const result = await loadBlogArticles('_slug-sem-blog');
    expect(result).toEqual([]);
  });

  it('[ERROR] BUILD_004 — frontmatter inválido', async () => {
    const badBlogDir = path.join(TEST_SITE_DIR, 'blog', 'articles');
    fs.writeFileSync(
      path.join(badBlogDir, 'bad-post.md'),
      '---\nslug: bad\ntitle: Curto\ndate: not-a-date\nauthor: X\n---\nConteúdo.'
    );

    await expect(loadBlogArticles(TEST_SLUG)).rejects.toThrow('[BUILD_004]');

    // Cleanup
    fs.rmSync(path.join(badBlogDir, 'bad-post.md'));
  });
});
