// src/lib/constants.ts
// Constantes tipadas do pipeline de blog distribuído
// Fonte: TASK-0 (module-11-blog-pipeline), INT-069, INT-073, INT-074

import type { SiteCategory } from '@/types';

// ============================================================
// CATEGORY_THEME_COLORS — theme-color injetado por categoria
// Fonte: TASK-3 intake-review (CL-341) — Safari/Chrome mobile address bar
// ============================================================

export const CATEGORY_THEME_COLORS: Record<SiteCategory, string> = {
  A: '#2563EB',
  B: '#EA580C',
  C: '#059669',
  D: '#7C3AED',
  E: '#0891B2',
  F: '#1E40AF',
} as const;

export const DEFAULT_THEME_COLOR = '#0F172A';

// ============================================================
// STATIC_FORMS — TASK-6 / CL-255
// Fallback de endpoint do provider. Sites referenciam o valor via
// `${env:STATIC_FORMS_URL}` em sites/<slug>/config.json.cta.formEndpoint.
// O config-loader resolve o placeholder a partir de process.env no build
// (ou runtime dev). Se a var nao estiver setada, permanece o fallback
// abaixo como ultimo recurso para swap de provider via env var unica.
// ============================================================
export const FORMS_ENDPOINT_FALLBACK_URL =
  process.env.STATIC_FORMS_URL ?? 'https://api.staticforms.xyz/submit';

// ============================================================
// FORMS_ENDPOINTS — TASK-20 / CL-142, CL-492
// Map de endpoints segmentados por slug + tipo. Convencao:
//   `{slug}-contato`, `{slug}-calc`, `{slug}-waitlist`
// Fallback chain: slug+tipo -> tipo geral -> FORMS_ENDPOINT_FALLBACK_URL.
// Em runtime, sites usam getFormEndpoint(slug, type) abaixo.
// ============================================================
export type FormType = 'contact' | 'calc' | 'waitlist';

/**
 * Resolve endpoint por slug+tipo com fallback.
 * Priority:
 *   1. config.formEndpoints[type] (do site)
 *   2. process.env[`STATIC_FORMS_URL_${slug}_${type}`]
 *   3. process.env.STATIC_FORMS_URL (geral)
 *   4. FORMS_ENDPOINT_FALLBACK_URL
 */
export function getFormEndpoint(
  type: FormType,
  ctx: { slug?: string; siteOverride?: string } = {},
): string {
  if (ctx.siteOverride) return ctx.siteOverride;
  const slug = ctx.slug;
  if (slug) {
    const envKey = `STATIC_FORMS_URL_${slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${type.toUpperCase()}`;
    const fromEnv = process.env[envKey];
    if (fromEnv) return fromEnv;
  }
  return FORMS_ENDPOINT_FALLBACK_URL;
}

// ============================================================
// CONSENT_COPY — TASK-2 intake-review (CL-235)
// Redacao canonica, unica e destacada do checkbox LGPD Art. 8
// em todos os formularios da rede (contact + waitlist). Manter
// como a unica fonte da verdade — qualquer texto divergente de
// consent deve ser substituido via <ConsentCheckbox>.
// ============================================================
export const CONSENT_COPY = {
  label: 'Concordo com a política de privacidade e autorizo contato comercial',
  privacyHref: '/privacidade',
  errorMessage: 'Você precisa aceitar para continuar',
} as const;

// ============================================================
// HEADER_VARIANT_BY_CATEGORY — variantes visuais do Header por categoria
// Fonte: TASK-4 intake-review (CL-148, CL-149, CL-150)
// ============================================================

export interface HeaderVariant {
  showUrgencyBadge?: boolean;
  urgencyText?: string;
  showTrustBadge?: boolean;
  trustText?: string;
  ctaLabel?: string;
  /** 'whatsapp' = resolve via config.cta.whatsappNumber; qualquer outro valor e usado como href literal */
  ctaHref?: string;
}

export const HEADER_VARIANT_BY_CATEGORY: Record<SiteCategory, HeaderVariant> = {
  A: { showUrgencyBadge: true, urgencyText: 'Vagas limitadas', ctaLabel: 'Falar no WhatsApp', ctaHref: 'whatsapp' },
  B: { showUrgencyBadge: false, ctaLabel: 'Falar no WhatsApp', ctaHref: 'whatsapp' },
  C: { showTrustBadge: true, trustText: '+150 cases', ctaLabel: 'Ver cases', ctaHref: '#cases' },
  D: { ctaLabel: 'Fazer diagnostico gratis', ctaHref: '#diagnostico' },
  E: { showUrgencyBadge: false, ctaLabel: 'Saber mais', ctaHref: '#sobre' },
  F: { ctaLabel: 'Falar no WhatsApp', ctaHref: 'whatsapp' },
};

// ============================================================
// BLOG_CONFIG — Configurações globais do pipeline de blog
// ============================================================

export const BLOG_CONFIG = {
  /** Mínimo de palavras por artigo (INT-069 / PRD secção SEO) */
  MIN_WORD_COUNT: 800,

  /** Palavras por minuto para cálculo de reading time */
  READING_TIME_WORDS_PER_MIN: 200,

  /** Artigos por página em listagens paginadas */
  ARTICLES_PER_PAGE: 10,

  /** Volume alvo da Onda 1 (modules 7-10) */
  ARTICLE_QUOTA_WAVE1: 56,

  /** Volume mínimo da Onda 2 (module-11/TASK-2) */
  ARTICLE_QUOTA_WAVE2: 40,

  /** Máximo de caracteres no título SEO */
  TITLE_MAX_LENGTH: 60,

  /** Máximo de caracteres na meta description */
  DESCRIPTION_MAX_LENGTH: 155,

  /** Mínimo de links internos por artigo (INT-074) */
  INTERLINKING_MIN: 2,

  /** Máximo de links internos por artigo */
  INTERLINKING_MAX: 5,

  /**
   * Sites com blog habilitado.
   * Usar nomes de diretório exatos em sites/.
   */
  SITES_WITH_BLOG: [
    // Categoria A — Nicho Vertical
    'a01', 'a02', 'a03', 'a04', 'a05', 'a06', 'a07',
    // Categoria C — Serviço Digital
    'c01-site-institucional-pme', 'c02-landing-page-conversao',
    // Categoria F — Blog Técnico
    'f01-blog-desenvolvimento-web', 'f02-blog-marketing-digital',
  ] as const,
} as const;

// ============================================================
// ARTICLE_STATUS — Status de publicação de um artigo
// ============================================================

export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
} as const;

export type ArticleStatus = typeof ARTICLE_STATUS[keyof typeof ARTICLE_STATUS];

// ============================================================
// BLOG_CATEGORIES — Categorias editoriais do pipeline
// ============================================================

export const BLOG_CATEGORIES = [
  'SEO',
  'Conversão',
  'Performance',
  'Ferramenta',
  'Caso de Uso',
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];

// ============================================================
// FUNNEL_STAGES — Estágios do funil editorial
// ============================================================

export const FUNNEL_STAGES = {
  TOFU: 'TOFU', // Top of Funnel — awareness
  MOFU: 'MOFU', // Middle of Funnel — consideration
  BOFU: 'BOFU', // Bottom of Funnel — decision
} as const;

export type FunnelStage = typeof FUNNEL_STAGES[keyof typeof FUNNEL_STAGES];

// ============================================================
// SEARCH_INTENTS — Intenções de busca mapeadas
// ============================================================

export const SEARCH_INTENTS = {
  HOW_TO: 'How-to',
  COMPARISON: 'Comparison',
  PRODUCT: 'Product',
  LOCAL: 'Local',
  NEWS: 'News',
} as const;

export type SearchIntent = typeof SEARCH_INTENTS[keyof typeof SEARCH_INTENTS];

// ============================================================
// INTERLINKING_RULES — Regras de linkagem interna (INT-074)
// ============================================================

export const INTERLINKING_RULES = {
  /** Mínimo de links internos por artigo */
  MIN_LINKS: BLOG_CONFIG.INTERLINKING_MIN,

  /** Máximo de links internos por artigo */
  MAX_LINKS: BLOG_CONFIG.INTERLINKING_MAX,

  /**
   * Anchor texts genéricos proibidos.
   * Script validate-interlinking.ts verifica e falha se encontrado.
   */
  FORBIDDEN_ANCHORS: [
    'clique aqui',
    'saiba mais',
    'leia mais',
    'acesse aqui',
    'veja aqui',
    'veja mais',
    'aqui',
    'link',
    'este artigo',
    'este post',
  ] as const,

  /**
   * Mínimo de artigos em um site para que interlinking seja obrigatório.
   * Sites com menos de 3 artigos são pulados.
   */
  MIN_ARTICLES_FOR_VALIDATION: 3,
} as const;

// ============================================================
// GEO_CONFIG — Configurações de GEO optimization
// ============================================================

export const GEO_CONFIG = {
  /** Máximo de palavras na resposta direta (primeiro bloco do artigo) */
  DIRECT_ANSWER_MAX_WORDS: 200,

  /** Mínimo de H2 sections por artigo */
  MIN_H2_SECTIONS: 2,

  /** Formatos aceitos para a resposta direta */
  DIRECT_ANSWER_FORMATS: ['table', 'list', 'definition', 'comparison'] as const,
} as const;
