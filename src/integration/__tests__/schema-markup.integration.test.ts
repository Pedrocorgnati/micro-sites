// src/integration/__tests__/schema-markup.integration.test.ts
//
// Testes de integração: pipeline completo config → JSON-LD schema markup
//
// Cobre:
//   - buildOrganizationSchema: campos obrigatórios + telefone
//   - buildFAQSchema: estrutura FAQ Page
//   - buildHowToSchema: passos HowTo
//   - buildLocalBusinessSchema: LocalBusiness com endereço BR
//   - buildArticleSchema: Article com author + publisher
//   - buildProductSchema: Product com oferta em BRL
//   - buildSchemasForSite: geração completa baseada em config.schema[]
//   - BUILD_055 warning: tipo de schema não suportado (não fatal)
//   - Pipeline: loadSiteConfig → buildSchemasForSite com dados reais

import { describe, it, expect, vi } from 'vitest';
import { loadSiteConfig } from '@/lib/content-loader';
import { loadBlogArticles } from '@/lib/content-loader';
import {
  buildOrganizationSchema,
  buildFAQSchema,
  buildHowToSchema,
  buildLocalBusinessSchema,
  buildArticleSchema,
  buildProductSchema,
  buildSchemasForSite,
} from '@/lib/schema-markup';
import { SLUG_D01, buildMinimalConfig, buildCatDConfig, buildBlogArticle } from '../helpers/fixtures';

const BASE_URL = 'https://d01.systemforge.com.br';

const SAMPLE_FAQS = [
  { question: 'Quanto custa um site?', answer: 'Depende do escopo e complexidade.' },
  { question: 'Quanto tempo leva?', answer: 'Entre 2 e 6 semanas normalmente.' },
];

const SAMPLE_STEPS = [
  { title: 'Preencha o formulário', desc: 'Informe seus dados e necessidades.' },
  { title: 'Receba o orçamento', desc: 'Em até 24h úteis.' },
  { title: 'Aprovação e início', desc: 'Assine o contrato e começamos.' },
];

// ─── Cenário 1: buildOrganizationSchema ──────────────────────────────────────

describe('buildOrganizationSchema — integração com config real', () => {
  it('pipeline: loadSiteConfig → buildOrganizationSchema produz JSON-LD válido', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schema = buildOrganizationSchema(config, BASE_URL);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe(config.name);
    expect(schema.url).toBe(BASE_URL);
    expect(schema.logo).toBe(`${BASE_URL}/brand/sf-logo.png`);
  });

  it('contactPoint.telephone inclui whatsappNumber do config', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schema = buildOrganizationSchema(config, BASE_URL);
    const contact = schema.contactPoint as Record<string, string>;

    expect(contact['@type']).toBe('ContactPoint');
    expect(contact.telephone).toContain(config.cta.whatsappNumber);
    expect(contact.contactType).toBe('customer service');
  });

  it('é serializável para JSON sem erros', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schema = buildOrganizationSchema(config, BASE_URL);
    expect(() => JSON.stringify(schema)).not.toThrow();
    const serialized = JSON.parse(JSON.stringify(schema));
    expect(serialized['@type']).toBe('Organization');
  });
});

// ─── Cenário 2: buildFAQSchema ────────────────────────────────────────────────

describe('buildFAQSchema', () => {
  it('produz FAQPage com mainEntity array', () => {
    const schema = buildFAQSchema(SAMPLE_FAQS);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('FAQPage');
    const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
    expect(Array.isArray(mainEntity)).toBe(true);
    expect(mainEntity.length).toBe(SAMPLE_FAQS.length);
  });

  it('cada Question tem name e acceptedAnswer', () => {
    const schema = buildFAQSchema(SAMPLE_FAQS);
    const questions = schema.mainEntity as Array<Record<string, unknown>>;

    for (let i = 0; i < SAMPLE_FAQS.length; i++) {
      expect(questions[i]['@type']).toBe('Question');
      expect(questions[i].name).toBe(SAMPLE_FAQS[i].question);
      const answer = questions[i].acceptedAnswer as Record<string, string>;
      expect(answer['@type']).toBe('Answer');
      expect(answer.text).toBe(SAMPLE_FAQS[i].answer);
    }
  });

  it('retorna FAQPage vazio quando array de FAQs é vazio', () => {
    const schema = buildFAQSchema([]);
    const mainEntity = schema.mainEntity as unknown[];
    expect(mainEntity).toEqual([]);
  });
});

// ─── Cenário 3: buildHowToSchema ─────────────────────────────────────────────

describe('buildHowToSchema — integração com config real', () => {
  it('pipeline: loadSiteConfig → buildHowToSchema produz JSON-LD válido', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schema = buildHowToSchema(SAMPLE_STEPS, config);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('HowTo');
    expect(schema.name).toContain(config.name.toLowerCase());
  });

  it('steps têm position incremental a partir de 1', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schema = buildHowToSchema(SAMPLE_STEPS, config);
    const steps = schema.step as Array<Record<string, unknown>>;

    for (let i = 0; i < SAMPLE_STEPS.length; i++) {
      expect(steps[i]['@type']).toBe('HowToStep');
      expect(steps[i].position).toBe(i + 1);
      expect(steps[i].name).toBe(SAMPLE_STEPS[i].title);
      expect(steps[i].text).toBe(SAMPLE_STEPS[i].desc);
    }
  });
});

// ─── Cenário 4: buildLocalBusinessSchema ─────────────────────────────────────

describe('buildLocalBusinessSchema — Cat.A', () => {
  it('produz LocalBusiness com endereço BR', () => {
    const config = buildMinimalConfig('A', {
      slug: 'a01-clinicas-estetica',
      category: 'A',
      template: 'landing',
      schema: ['LocalBusiness', 'FAQPage'],
    });
    const schema = buildLocalBusinessSchema(config, BASE_URL);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('LocalBusiness');
    expect(schema.name).toBe(config.name);
    expect(schema.url).toBe(BASE_URL);

    const address = schema.address as Record<string, string>;
    expect(address['@type']).toBe('PostalAddress');
    expect(address.addressCountry).toBe('BR');
    expect(address.addressLocality).toBeTruthy();
  });

  it('telephone inclui whatsappNumber', () => {
    const config = buildMinimalConfig('A', {
      slug: 'a01-clinicas-estetica',
    });
    const schema = buildLocalBusinessSchema(config, BASE_URL);
    expect(schema.telephone).toContain(config.cta.whatsappNumber);
  });
});

// ─── Cenário 5: buildArticleSchema ───────────────────────────────────────────

describe('buildArticleSchema — integração com artigo real', () => {
  it('pipeline: loadSiteConfig + loadBlogArticles → buildArticleSchema', async () => {
    const config = loadSiteConfig(SLUG_D01);
    const articles = await loadBlogArticles(SLUG_D01);
    const article = articles[0];

    const schema = buildArticleSchema(article, config, BASE_URL);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Article');
    expect(schema.headline).toBe(article.title);
    expect(schema.description).toBe(article.description);
    expect(schema.datePublished).toBe(article.date);
  });

  it('author fallback usa config.name quando article.author não definido', () => {
    const config = loadSiteConfig(SLUG_D01);
    const article = buildBlogArticle({ author: undefined });
    const schema = buildArticleSchema(article, config, BASE_URL);
    const author = schema.author as Record<string, string>;

    expect(author.name).toBe(config.name);
  });

  it('publisher é Organization com logo', () => {
    const config = loadSiteConfig(SLUG_D01);
    const article = buildBlogArticle();
    const schema = buildArticleSchema(article, config, BASE_URL);
    const publisher = schema.publisher as Record<string, unknown>;

    expect(publisher['@type']).toBe('Organization');
    expect(publisher.name).toBe(config.name);
    expect(publisher.logo).toBe(`${BASE_URL}/brand/sf-logo.png`);
  });
});

// ─── Cenário 6: buildProductSchema ───────────────────────────────────────────

describe('buildProductSchema — Cat.E', () => {
  it('produz Product com oferta em BRL', () => {
    const config = buildMinimalConfig('E', {
      slug: 'e01-ia-para-pequenos-negocios',
      category: 'E',
      template: 'waitlist',
      schema: ['Organization', 'Product'],
    });
    const schema = buildProductSchema(config, BASE_URL);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Product');
    expect(schema.name).toBe(config.name);
    expect(schema.description).toBe(config.seo.description);

    const offers = schema.offers as Record<string, string>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.priceCurrency).toBe('BRL');
    expect(offers.availability).toContain('schema.org');
  });
});

// ─── Cenário 7: buildSchemasForSite — orquestrador ───────────────────────────

describe('buildSchemasForSite — integração com config real', () => {
  it('pipeline: loadSiteConfig → buildSchemasForSite retorna array não vazio', () => {
    const config = loadSiteConfig(SLUG_D01);
    // d01 tem schema: ['FAQPage', 'Organization', 'HowTo']
    const schemas = buildSchemasForSite(config, BASE_URL, {
      faqs: SAMPLE_FAQS,
      howToSteps: SAMPLE_STEPS,
    });

    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas.length).toBeGreaterThanOrEqual(1);
  });

  it('schema types gerados correspondem aos declarados no config.schema[]', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schemas = buildSchemasForSite(config, BASE_URL, {
      faqs: SAMPLE_FAQS,
      howToSteps: SAMPLE_STEPS,
    });

    const generatedTypes = schemas.map((s) => s['@type']);
    for (const type of config.schema) {
      expect(generatedTypes).toContain(type);
    }
  });

  it('cada schema no array é JSON-LD válido (tem @context e @type)', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schemas = buildSchemasForSite(config, BASE_URL, {
      faqs: SAMPLE_FAQS,
      howToSteps: SAMPLE_STEPS,
    });

    for (const schema of schemas) {
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBeTruthy();
    }
  });

  it('todos os schemas são serializáveis para JSON (sem circular refs)', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schemas = buildSchemasForSite(config, BASE_URL, {
      faqs: SAMPLE_FAQS,
      howToSteps: SAMPLE_STEPS,
    });

    expect(() => JSON.stringify(schemas)).not.toThrow();
  });

  it('BUILD_055 warning: schema Article sem extras.article — retorna null filtrado', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = buildMinimalConfig('F', {
      slug: 'f01-blog-desenvolvimento-web',
      category: 'F',
      template: 'blog',
      schema: ['Organization', 'Article'], // Article requer extras.article
    });

    const schemas = buildSchemasForSite(config, BASE_URL, {}); // sem extras.article

    // Article schema é removido pelo filter(Boolean) — BUILD_055 warning disparado
    const types = schemas.map((s) => s['@type']);
    expect(types).not.toContain('Article');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('BUILD_055'));

    consoleSpy.mockRestore();
  });

  it('schema Article com extras.article é incluído corretamente', async () => {
    const config = loadSiteConfig(SLUG_D01);
    const articles = await loadBlogArticles(SLUG_D01);
    const configComArticle = buildCatDConfig({
      schema: ['Organization', 'Article'],
    });

    const schemas = buildSchemasForSite(configComArticle, BASE_URL, {
      article: articles[0],
    });

    const types = schemas.map((s) => s['@type']);
    expect(types).toContain('Article');
  });

  it('Cat.A com LocalBusiness schema gera LocalBusiness JSON-LD', () => {
    const config = buildMinimalConfig('A', {
      slug: 'a01-clinicas-estetica',
      category: 'A',
      template: 'landing',
      schema: ['LocalBusiness', 'FAQPage'],
    });

    const schemas = buildSchemasForSite(config, BASE_URL, { faqs: SAMPLE_FAQS });
    const types = schemas.map((s) => s['@type']);

    expect(types).toContain('LocalBusiness');
    expect(types).toContain('FAQPage');
  });
});

// ─── Cenário 8: Segurança — dados externos no schema markup ──────────────────

describe('schema markup — segurança de dados', () => {
  it('schema markup não expõe dados sensíveis (sem tokens, chaves privadas)', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schemas = buildSchemasForSite(config, BASE_URL, {
      faqs: SAMPLE_FAQS,
      howToSteps: SAMPLE_STEPS,
    });
    const serialized = JSON.stringify(schemas);

    // Verifica que nenhum campo sensível é incluído inadvertidamente
    expect(serialized).not.toContain('formAccessKey');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('apiKey');
  });

  it('URLs no schema markup são HTTPS', () => {
    const config = loadSiteConfig(SLUG_D01);
    const schemas = buildSchemasForSite(config, BASE_URL, {
      faqs: SAMPLE_FAQS,
    });

    const serialized = JSON.stringify(schemas);
    // Extrair todas as URLs no JSON
    const urlMatches = serialized.match(/https?:\/\/[^\\"]+/g) ?? [];
    for (const url of urlMatches) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});
