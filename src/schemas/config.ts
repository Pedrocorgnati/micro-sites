// src/schemas/config.ts
// Valida config.json de cada site em build-time
import { z } from 'zod';
import { SITE_LIMITS } from '@/types';

// Lista canônica de slugs válidos — alinhada ao union type CategorySlug
const VALID_SLUGS = [
  'a01-clinicas-estetica','a02-academia-crossfit','a03-restaurante-delivery',
  'a04-pet-shop-veterinario','a05-advocacia-familia','a06-psicologia-online',
  'a07-contabilidade-digital','a08-imobiliaria-regional','a09-escola-idiomas','a10-clinica-odontologica',
  'b01-sem-site-profissional','b02-site-antigo-lento','b03-sem-automacao',
  'b04-sem-presenca-digital','b05-perder-clientes-online',
  'b06-sem-leads-qualificados','b07-site-nao-aparece-google','b08-concorrente-digital',
  'c01-site-institucional-pme','c02-landing-page-conversao','c03-app-web-negocio',
  'c04-ecommerce-pequeno-negocio','c05-sistema-agendamento',
  'c06-automacao-atendimento','c07-sistema-gestao-web','c08-marketplace-nicho',
  'd01-calculadora-custo-site','d02-calculadora-roi-digital','d03-diagnostico-presenca-digital',
  'd04-quanto-custa-sistema','d05-simulador-trafego-pago',
  'e01-ia-para-pequenos-negocios','e02-automacao-whatsapp','e03-site-com-ia',
  'f01-blog-desenvolvimento-web','f02-blog-marketing-digital',
] as const;

export const SEOConfigSchema = z.object({
  title: z.string().max(SITE_LIMITS.titleMaxLength, `Título máximo ${SITE_LIMITS.titleMaxLength} chars`),
  description: z.string().max(SITE_LIMITS.descriptionMaxLength, `Descrição máximo ${SITE_LIMITS.descriptionMaxLength} chars`),
  keywords: z.array(z.string()).min(1, 'Ao menos 1 keyword obrigatória').max(SITE_LIMITS.keywordsMax),
  ogTitle: z.string().max(SITE_LIMITS.titleMaxLength).optional(),
  ogDescription: z.string().max(SITE_LIMITS.descriptionMaxLength).optional(),
  canonical: z.string().url('canonical deve ser URL válida').optional(),
  ogImage: z.string().url('ogImage deve ser URL válida').optional(),
  noindex: z.boolean().optional(),
});

export const CTAConfigSchema = z.object({
  primaryLabel: z.string().min(1, 'primaryLabel obrigatório'),
  formEndpoint: z.string().url('formEndpoint deve ser URL válida'),
  whatsappNumber: z.string().regex(/^\d+$/, 'whatsappNumber deve conter apenas dígitos'),
  whatsappMessage: z.string().min(1, 'whatsappMessage obrigatório'),
});

export const LeadMagnetConfigSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(['calculator', 'diagnostic', 'checklist']),
  partialResultLabel: z.string().min(1),
  fullResultPath: z.string().startsWith('/', 'fullResultPath deve iniciar com /'),
});

export const SiteConfigSchema = z.object({
  slug: z.enum(VALID_SLUGS),
  name: z.string().min(3, 'name deve ter ao menos 3 chars'),
  category: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'accentColor deve ser hex #xxxxxx'),
  wave: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  funnelStage: z.enum(['awareness', 'consideration', 'decision']),
  template: z.enum(['landing', 'blog', 'calculator', 'waitlist']),
  hasBlog: z.boolean(),
  schema: z.array(z.enum(['Organization','FAQPage','HowTo','LocalBusiness','Product','Article'])).min(1),
  // Campos adicionais de implementação (opcionais)
  deployWave: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  sectionOrder: z.enum(['default', 'b-variant', 'd-variant']).optional(),
  headline: z.string().min(3).optional(),
  subheadline: z.string().min(3).optional(),
  seo: SEOConfigSchema,
  cta: CTAConfigSchema,
  leadMagnet: LeadMagnetConfigSchema.optional(),
  relatedSites: z.array(z.enum(VALID_SLUGS)).max(SITE_LIMITS.maxRelatedSites).optional(),
  features: z.array(z.string()).optional(),
  gaId: z.string().optional(),
  showSystemForgeLogo: z.boolean().optional(),
  footerLinks: z.array(z.object({
    label: z.string(),
    href: z.string(),
  })).optional(),
}).refine(
  (data) => data.category !== 'D' || data.leadMagnet !== undefined,
  { message: 'Cat. D obriga leadMagnet', path: ['leadMagnet'] }
).refine(
  (data) => data.category !== 'E' || data.template === 'waitlist',
  { message: 'Cat. E obriga template: waitlist', path: ['template'] }
);

export type SiteConfigInput = z.infer<typeof SiteConfigSchema>;
export type SEOConfigInput = z.infer<typeof SEOConfigSchema>;
export type CTAConfigInput = z.infer<typeof CTAConfigSchema>;
