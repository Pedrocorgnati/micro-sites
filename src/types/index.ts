// ============================================================
// TYPE SYSTEM — Micro Sites
// Fonte: PRD.md, HLD.md, module-1/TASK-1.md
// ============================================================

// --- Enums ---

export type SiteCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type CategorySlug =
  // Categoria A — Nicho Vertical
  | 'a01-clinicas-estetica' | 'a02-academia-crossfit' | 'a03-restaurante-delivery'
  | 'a04-pet-shop-veterinario' | 'a05-advocacia-familia' | 'a06-psicologia-online'
  // Categoria B — Dor / Problema
  | 'b01-sem-site-profissional' | 'b02-site-antigo-lento' | 'b03-sem-automacao'
  | 'b04-sem-presenca-digital' | 'b05-perder-clientes-online'
  // Categoria C — Solução
  | 'c01-site-institucional-pme' | 'c02-landing-page-conversao' | 'c03-app-web-negocio'
  | 'c04-ecommerce-pequeno-negocio' | 'c05-sistema-agendamento'
  // Categoria D — Ferramenta Interativa
  | 'd01-calculadora-custo-site' | 'd02-calculadora-roi-digital' | 'd03-diagnostico-presenca-digital'
  | 'd04-quanto-custa-sistema' | 'd05-simulador-trafego-pago'
  // Categoria E — Waitlist / Tendência
  | 'e01-ia-para-pequenos-negocios' | 'e02-automacao-whatsapp' | 'e03-site-com-ia'
  // Categoria F — Blog Técnico
  | 'f01-blog-desenvolvimento-web' | 'f02-blog-marketing-digital'
  // Categoria A — Nicho Vertical (extras)
  | 'a07-contabilidade-digital' | 'a08-imobiliaria-regional'
  | 'a09-escola-idiomas' | 'a10-clinica-odontologica'
  // Categoria B — Dor / Problema (extras)
  | 'b06-sem-leads-qualificados' | 'b07-site-nao-aparece-google' | 'b08-concorrente-digital'
  // Categoria C — Solução (extras)
  | 'c06-automacao-atendimento' | 'c07-sistema-gestao-web' | 'c08-marketplace-nicho';

export type FunnelStage = 'awareness' | 'consideration' | 'decision';

export type DeployWave = 1 | 2 | 3;

export type PageTemplate = 'landing' | 'blog' | 'calculator' | 'waitlist';

export type SchemaType =
  | 'Organization'
  | 'LocalBusiness'
  | 'FAQPage'
  | 'HowTo'
  | 'Article'
  | 'Product';

export type SiteOrder = 'default' | 'b-variant' | 'd-variant';

export type CalculatorType = 'calculator' | 'diagnostic' | 'checklist';

// --- Interfaces ---

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface CTAConfig {
  primaryLabel: string;
  formEndpoint: string;
  whatsappNumber: string;
  whatsappMessage: string;
}

export interface LeadMagnetConfig {
  enabled: boolean;
  type: CalculatorType;
  partialResultLabel: string;
  fullResultPath: string;
}

export interface SiteConfig {
  // Identidade
  slug: CategorySlug;
  name: string;
  category: SiteCategory;
  accentColor: string;
  wave: DeployWave;
  funnelStage: FunnelStage;
  template: PageTemplate;
  hasBlog: boolean;
  schema: SchemaType[];

  // Campos adicionais de implementação
  deployWave?: DeployWave;
  sectionOrder?: SiteOrder;
  headline?: string;
  subheadline?: string;

  // SEO
  seo: SEOConfig;

  // CTA
  cta: CTAConfig;

  // Opcional
  leadMagnet?: LeadMagnetConfig;
  relatedSites?: CategorySlug[];
  features?: string[];
  gaId?: string;
  showSystemForgeLogo?: boolean;
  footerLinks?: { label: string; href: string }[];
}

// --- Tipos de conteúdo ---

export interface FAQ {
  question: string;
  answer: string;
}

export interface Feature {
  icon?: string;
  title: string;
  description: string;
}

export interface Step {
  number?: number;
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Testimonial {
  name: string;
  role?: string;
  quote: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  author?: string;
  date: string;
  readingTime?: number;
  tags?: string[];
  body: string;
}

export interface SiteContent {
  hero?: {
    headline?: string;
    subheadline?: string;
  };
  problem?: {
    headline?: string;
    content: string;
  };
  solution?: {
    headline?: string;
    content: string;
  };
  features?: {
    headline?: string;
    items: Feature[];
  };
  howItWorks?: {
    headline?: string;
    steps: Step[];
  };
  trust?: {
    headline?: string;
    stats?: Stat[];
    testimonials?: Testimonial[];
  };
  cta?: {
    headline?: string;
    subheadline?: string;
  };
  faqs?: {
    headline?: string;
    items: FAQ[];
  };
  contact?: {
    headline?: string;
    subheadline?: string;
  };
  blog?: BlogArticle[];
}

// --- Tipos auxiliares ---

export interface PageContent {
  filename: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface CalculatorInput {
  id: string;
  label: string;
  type: 'select' | 'radio' | 'number' | 'checkbox';
  options?: Array<{ value: string; label: string; points?: number }>;
  weight?: number;
}

// --- Constantes de acento ---

export interface AccentColors {
  accent: string;
  accentHover: string;
  onAccent: string;
  secondary: string;
  onSecondary: string;
}

export const ACCENT_COLORS: Record<SiteCategory, AccentColors> = {
  A: { accent: '#2563EB', accentHover: '#1D4ED8', onAccent: '#FFFFFF', secondary: '#93C5FD', onSecondary: '#1E3A8A' },
  B: { accent: '#EA580C', accentHover: '#C2410C', onAccent: '#FFFFFF', secondary: '#FDBA74', onSecondary: '#7C2D12' },
  C: { accent: '#059669', accentHover: '#047857', onAccent: '#FFFFFF', secondary: '#6EE7B7', onSecondary: '#064E3B' },
  D: { accent: '#7C3AED', accentHover: '#6D28D9', onAccent: '#FFFFFF', secondary: '#C4B5FD', onSecondary: '#4C1D95' },
  E: { accent: '#0891B2', accentHover: '#0E7490', onAccent: '#FFFFFF', secondary: '#67E8F9', onSecondary: '#155E75' },
  F: { accent: '#1E40AF', accentHover: '#1E3A8A', onAccent: '#FFFFFF', secondary: '#93C5FD', onSecondary: '#1E3A8A' },
};

export const CTA_LABELS: Record<SiteCategory, string> = {
  A: 'Solicitar Orçamento Gratuito',
  B: 'Resolver Meu Problema',
  C: 'Contratar Agora',
  D: 'Ver Resultado Completo',
  E: 'Entrar na Lista de Espera',
  F: 'Falar com Especialista',
};

export const CATEGORY_NAMES: Record<SiteCategory, string> = {
  A: 'Nicho Local',
  B: 'Dor de Negócio',
  C: 'Serviço Digital',
  D: 'Ferramenta Interativa',
  E: 'Pré-SaaS / Waitlist',
  F: 'Conteúdo Educativo',
};

export const SITE_LIMITS = {
  maxSites: 36,
  maxBlogArticles: 50,
  maxFAQItems: 20,
  maxFeatureGridItems: 6,
  maxRelatedSites: 4,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  titleMaxLength: 60,
  descriptionMaxLength: 155,
  keywordsMax: 6,
} as const;

export const PAGE_ROUTES = {
  home: '/',
  contact: '/contato',
  thanks: '/obrigado',
  privacy: '/privacidade',
  faq: '/faq',
  result: '/resultado',
  blog: '/blog',
  waitlist: '/lista-de-espera',
} as const;

export const TIMING = {
  formDebounceMs: 300,
  formTimeoutMs: 10_000,
  calculatorDebounceMs: 150,
  localStorageTTLMs: 24 * 60 * 60 * 1000,
} as const;

export const STORAGE_KEYS = {
  cookieConsent: 'cookie_consent',
  cookieConsentTimestamp: 'cookie_consent_ts',
  calculatorProgress: (slug: string) => `calc_progress_${slug}`,
} as const;

export const SECTION_ORDER = {
  landing: ['hero', 'problem', 'solution', 'features', 'howItWorks', 'trust', 'faq', 'cta'],
  landing_B: ['hero', 'solution', 'problem', 'features', 'howItWorks', 'trust', 'faq', 'cta'],
  landing_A: ['hero', 'problem', 'solution', 'features', 'localTestimonials', 'howItWorks', 'trust', 'faq', 'cta'],
  calculator: ['hero', 'calculator', 'problem', 'solution', 'features', 'trust', 'faq', 'cta'],
  waitlist: ['hero', 'problem', 'waitlist', 'trust', 'faq'],
} as const;

export const WHATSAPP_NUMBER = '5511999999999';
export const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';
