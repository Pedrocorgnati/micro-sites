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
  // Templates extras
  | string;

export type FunnelStage = 'awareness' | 'consideration' | 'decision' | 'conversion';

export type DeployWave = 1 | 2 | 3 | 4;

export type PageTemplate = 'landing' | 'blog' | 'calculator' | 'waitlist';

export type SchemaType =
  | 'Organization'
  | 'LocalBusiness'
  | 'FAQPage'
  | 'HowTo'
  | 'Article'
  | 'Product';

export type SiteOrder = 'default' | 'b-variant' | 'd-variant';

// --- Interfaces ---

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
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
  type?: 'email-gate' | 'full-result' | 'download';
  incentive?: string;
}

export interface SiteConfig {
  // Identidade
  slug: string;
  name: string;
  category: SiteCategory;
  funnelStage: FunnelStage;
  deployWave: DeployWave;
  template: PageTemplate;
  sectionOrder: SiteOrder;

  // Conteúdo
  headline: string;
  subheadline: string;

  // SEO
  seo: SEOConfig;

  // CTA
  cta: CTAConfig;

  // Opcional
  leadMagnet?: LeadMagnetConfig;
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
