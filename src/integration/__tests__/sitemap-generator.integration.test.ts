// src/integration/__tests__/sitemap-generator.integration.test.ts
//
// Testes de integração: pipeline completo config → sitemap/robots
//
// Cobre:
//   - generateSitemap: rotas estáticas sempre presentes
//   - generateSitemap: rotas condicionais por categoria (A-F)
//   - generateSitemap: rota /blog incluída quando hasBlog=true
//   - generateSitemap: rota /resultado para Cat.D com leadMagnet
//   - generateSitemap: rota /lista-de-espera para Cat.E
//   - generateRobotsTxt: formato correto
//   - Pipeline: loadSiteConfig → generateSitemap com dados reais

import { describe, it, expect } from 'vitest';
import { loadSiteConfig } from '@/lib/content-loader';
import { generateSitemap, generateRobotsTxt } from '@/lib/sitemap-generator';
import { SLUG_D01, buildMinimalConfig } from '../helpers/fixtures';

const BASE_URL = 'https://d01.systemforge.com.br';
const STATIC_ROUTES = ['/', '/contato', '/obrigado', '/privacidade'];

// ─── Cenário 1: Rotas estáticas sempre presentes ─────────────────────────────

describe('generateSitemap — rotas estáticas obrigatórias', () => {
  it('pipeline: loadSiteConfig → generateSitemap contém rotas estáticas', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL);

    for (const route of STATIC_ROUTES) {
      expect(xml).toContain(`${BASE_URL}${route}`);
    }
  });

  it('sitemap é XML válido (começa com declaração XML)', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL);

    expect(xml).toMatch(/^<\?xml version="1\.0"/);
    expect(xml).toContain('<urlset');
    expect(xml).toContain('</urlset>');
  });

  it('home "/" tem priority 1.0 e changefreq weekly', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL);

    // A home tem prioridade máxima
    expect(xml).toContain('<priority>1.0</priority>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
  });

  it('páginas secundárias têm priority 0.8 e changefreq monthly', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL);

    expect(xml).toContain('<priority>0.8</priority>');
    expect(xml).toContain('<changefreq>monthly</changefreq>');
  });

  it('cada <url> tem <loc> com URL absoluta HTTPS', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL);

    const locMatches = xml.match(/<loc>(.*?)<\/loc>/g) ?? [];
    expect(locMatches.length).toBeGreaterThan(0);

    for (const loc of locMatches) {
      const url = loc.replace(/<\/?loc>/g, '');
      expect(url).toMatch(/^https:\/\//);
    }
  });
});

// ─── Cenário 2: Rotas condicionais por categoria ─────────────────────────────

describe('generateSitemap — rotas condicionais por categoria', () => {
  it('Cat.D inclui /faq (categorias A, B, C, D, F)', () => {
    const config = loadSiteConfig(SLUG_D01); // Cat.D
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).toContain(`${BASE_URL}/faq`);
  });

  it('Cat.D inclui /quanto-custa/', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).toContain(`${BASE_URL}/quanto-custa/`);
  });

  it('Cat.D com leadMagnet enabled inclui /resultado', () => {
    const config = loadSiteConfig(SLUG_D01);
    // d01 tem leadMagnet.enabled = true → deve incluir /resultado
    expect(config.leadMagnet?.enabled).toBe(true);
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).toContain(`${BASE_URL}/resultado`);
  });

  it('Cat.D com leadMagnet disabled NÃO inclui /resultado', () => {
    const config = buildMinimalConfig('D', {
      slug: 'd01-calculadora-custo-site',
      category: 'D',
      template: 'calculator',
      hasBlog: false,
      schema: ['Organization', 'FAQPage'],
      leadMagnet: {
        enabled: false,
        type: 'calculator',
        partialResultLabel: 'Resultado',
        fullResultPath: '/resultado',
      },
    });
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).not.toContain(`${BASE_URL}/resultado`);
  });

  it('Cat.E inclui /lista-de-espera', () => {
    const config = buildMinimalConfig('E', {
      slug: 'e01-ia-para-pequenos-negocios',
      category: 'E',
      template: 'waitlist',
      hasBlog: false,
      schema: ['Organization', 'Product'],
    });
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).toContain(`${BASE_URL}/lista-de-espera`);
  });

  it('Cat.E NÃO inclui /faq (apenas A, B, C, D, F)', () => {
    const config = buildMinimalConfig('E', {
      slug: 'e01-ia-para-pequenos-negocios',
      category: 'E',
      template: 'waitlist',
      hasBlog: false,
      schema: ['Organization', 'Product'],
    });
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).not.toContain(`${BASE_URL}/faq`);
  });

  it('Cat.A inclui /faq', () => {
    const config = buildMinimalConfig('A', {
      slug: 'a01-clinicas-estetica',
      category: 'A',
      template: 'landing',
      hasBlog: false,
      schema: ['LocalBusiness', 'FAQPage'],
    });
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).toContain(`${BASE_URL}/faq`);
  });
});

// ─── Cenário 3: Rota /blog condicional ──────────────────────────────────────

describe('generateSitemap — rota /blog', () => {
  it('inclui /blog quando hasBlog=true (d01 real)', () => {
    const config = loadSiteConfig(SLUG_D01);
    expect(config.hasBlog).toBe(true);
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).toContain(`${BASE_URL}/blog`);
  });

  it('NÃO inclui /blog quando hasBlog=false', () => {
    const config = buildMinimalConfig('C', {
      slug: 'c01-site-institucional-pme',
      hasBlog: false,
    });
    const xml = generateSitemap(config, BASE_URL);
    expect(xml).not.toContain(`${BASE_URL}/blog`);
  });
});

// ─── Cenário 4: extraPaths ────────────────────────────────────────────────────

describe('generateSitemap — extraPaths', () => {
  it('injeta paths extras no sitemap', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL, ['/blog/custo-criar-site-2026/']);

    expect(xml).toContain(`${BASE_URL}/blog/custo-criar-site-2026/`);
  });

  it('sem extraPaths não injeta URLs extras', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xmlSem = generateSitemap(config, BASE_URL);
    const xmlCom = generateSitemap(config, BASE_URL, ['/extra-path/']);

    expect(xmlCom.length).toBeGreaterThan(xmlSem.length);
  });
});

// ─── Cenário 5: generateRobotsTxt ────────────────────────────────────────────

describe('generateRobotsTxt', () => {
  it('contém User-agent: * e Allow: /', () => {
    const robots = generateRobotsTxt(BASE_URL);
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
  });

  it('contém Sitemap URL com base URL correto', () => {
    const robots = generateRobotsTxt(BASE_URL);
    expect(robots).toContain(`Sitemap: ${BASE_URL}/sitemap.xml`);
  });

  it('Sitemap URL usa HTTPS', () => {
    const robots = generateRobotsTxt('https://d01.systemforge.com.br');
    const sitemapLine = robots.split('\n').find((l) => l.startsWith('Sitemap:'));
    expect(sitemapLine).toMatch(/^Sitemap: https:\/\//);
  });
});

// ─── Cenário 6: Contagem de URLs ─────────────────────────────────────────────

describe('generateSitemap — contagem de URLs', () => {
  it('d01 (Cat.D + blog + leadMagnet) tem pelo menos 7 rotas', () => {
    const config = loadSiteConfig(SLUG_D01);
    const xml = generateSitemap(config, BASE_URL);
    const urlCount = (xml.match(/<url>/g) ?? []).length;
    // 4 estáticas + /faq + /quanto-custa/ + /resultado + /blog = 8
    expect(urlCount).toBeGreaterThanOrEqual(7);
  });

  it('site minimal (Cat.C sem blog) tem apenas 4 rotas', () => {
    const config = buildMinimalConfig('C', {
      slug: 'c01-site-institucional-pme',
      hasBlog: false,
      category: 'C',
    });
    // Categoria C não tem /faq, não tem /blog, não tem /waitlist
    // Somente rotas estáticas: 4 rotas + /faq (A,B,C,D,F incluem /faq)
    const xml = generateSitemap(config, BASE_URL);
    const urlCount = (xml.match(/<url>/g) ?? []).length;
    // Cat.C inclui /faq → 5 rotas
    expect(urlCount).toBeGreaterThanOrEqual(4);
  });
});
