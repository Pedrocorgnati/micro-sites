// src/schemas/config.ts
// Valida config.json de cada site em build-time
import { z } from 'zod';
import { SITE_LIMITS } from '@/types';
import { isSafeExternalLink, isSafeAnchorText } from '@/lib/cross-link-sanitizer';

// Lista canônica de slugs válidos — alinhada ao union type CategorySlug
const VALID_SLUGS = [
  // Categoria A — slugs curtos (módulo-9, nicho real)
  'a01','a02','a03','a04','a05','a06','a07','a08','a09','a10',
  // Categoria A — slugs descritivos legados
  'a01-clinicas-estetica','a02-academia-crossfit','a03-restaurante-delivery',
  'a04-pet-shop-veterinario','a05-advocacia-familia','a06-psicologia-online',
  'a07-contabilidade-digital','a08-imobiliaria-regional','a09-escola-idiomas','a10-clinica-odontologica',
  'b01-sem-site-profissional','b02-site-antigo-lento','b03-sem-automacao',
  'b04-sem-presenca-digital','b05-perder-clientes-online',
  'b06-sem-leads-qualificados','b07-site-nao-aparece-google','b08-concorrente-digital',
  'c01-site-institucional-pme','c02-landing-page-conversao','c03-app-web-negocio',
  'c04-ecommerce-pequeno-negocio','c05-sistema-agendamento',
  'c06-automacao-atendimento','c07-sistema-gestao-web','c08-manutencao-software',
  'd01-calculadora-custo-site',
  'd02-calculadora-custo-app','d02-calculadora-roi-digital',
  'd03-diagnostico-maturidade-digital','d03-diagnostico-presenca-digital',
  'd04-calculadora-roi-automacao','d04-quanto-custa-sistema',
  'd05-checklist-presenca-digital','d05-simulador-trafego-pago',
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

// CL-387: whatsappNumber formato BR estrito — 55 + DDD (2) + numero (8 ou 9 digitos) = 12 ou 13 digitos
// Lista de placeholders proibidos que passam no regex mas nao sao numeros reais
const WHATSAPP_PLACEHOLDERS = new Set([
  '5500000000000',
  '5511000000000',
  '5599999999999',
  '5511999999999',
  // Sequenciais de exemplo historicos do workspace
  '5511999990001','5511999990002','5511999990003','5511999990004','5511999990005',
  '5511999990006','5511999990007','5511999990008','5511999990009','5511999990010',
]);

export const CTAConfigSchema = z.object({
  primaryLabel: z.string().min(1, 'primaryLabel obrigatório'),
  formEndpoint: z.string().url('formEndpoint deve ser URL válida'),
  whatsappNumber: z.string()
    .regex(/^55\d{10,11}$/, 'whatsappNumber deve seguir formato 55DDDXXXXXXXXX (12 ou 13 dígitos)')
    .refine((v) => !WHATSAPP_PLACEHOLDERS.has(v), {
      message: 'whatsappNumber nao pode ser placeholder conhecido (CL-387)',
    }),
  whatsappMessage: z.string().min(1, 'whatsappMessage obrigatório'),
});

// CL-143: lista de emails proibidos (placeholders/mocks)
const EMAIL_PLACEHOLDERS = new Set([
  'test@test.com',
  'email@example.com',
  'mock@example.com',
]);
const EMAIL_BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.org',
  'test.com',
  'localhost',
]);

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
  // CL-223/CL-369: flag para desabilitar /faq quando nao ha conteudo de FAQ
  faqEnabled: z.boolean().optional(),
  // CL-143: contactEmail obrigatorio + bloqueio de placeholders
  contactEmail: z.string()
    .email('contactEmail deve ser email válido')
    .refine((v) => !EMAIL_PLACEHOLDERS.has(v.toLowerCase()), {
      message: 'contactEmail nao pode ser placeholder (CL-143)',
    })
    .refine((v) => {
      const domain = v.split('@')[1]?.toLowerCase() ?? '';
      return !EMAIL_BLOCKED_DOMAINS.has(domain);
    }, { message: 'contactEmail nao pode usar dominio de teste (CL-143)' }),
  lastReviewed: z.string().optional(),
  // Categoria A — LocalBusiness data
  localBusiness: z.object({
    type: z.string(),
    address: z.string().optional(),
    phone: z.string().optional(),
    openingHours: z.string().optional(),
    priceRange: z.string().optional(),
  }).optional(),
  footerLinks: z.array(z.object({
    label: z.string(),
    href: z.string(),
  })).optional(),
  // Module-12: Cross-site interlinking (RC-INT-002: máx. 3 links)
  // Segurança: domain allowlist + anti-XSS (TASK-0 ST007)
  crossLinks: z.array(z.object({
    href: z.string()
      .url('crossLinks[].href deve ser URL válida')
      .refine(isSafeExternalLink, { message: 'href deve apontar para domínio da rede (allowlist)' }),
    anchor: z.string()
      .min(10, 'anchor text ≥ 10 chars (spec ST007)')
      .max(120, 'anchor text ≤ 120 chars (spec ST007)')
      .refine(isSafeAnchorText, { message: 'anchor não pode conter HTML (anti-XSS)' }),
    context: z.enum(['footer', 'article', 'cta', 'resultado']),
  })).max(3, 'Máximo 3 cross-links por site (RC-INT-002)').optional(),
  // Categoria B — Exit-Intent Popup (INT-038)
  exitIntent: z.object({
    offerText: z.string().min(1),
    offerSubtext: z.string().optional(),
    ctaLabel: z.string().min(1),
    ctaHref: z.string().optional(),
  }).optional(),
  // Categoria E — Waitlist / Pré-SaaS (INT-015)
  waitlist: z.object({
    count: z.number().int().positive().optional(),
    earlyBirdDiscount: z.string().optional(),
    endpoint: z.string().url().optional(),
  }).optional(),
  // ADS-01 — Google AdSense (clientId vem de NEXT_PUBLIC_ADSENSE_CLIENT_ID, testMode de NEXT_PUBLIC_APP_ENV)
  // INV-ADS-05: schema NÃO aceita clientId nem testMode (SoT em env).
  adsense: z.object({
    enabled: z.boolean().default(true),
    slots: z.object({
      header: z.string().regex(/^\d{10}$/, 'slot deve ter 10 dígitos').optional(),
      inArticle: z.string().regex(/^\d{10}$/, 'slot deve ter 10 dígitos').optional(),
      sidebar: z.string().regex(/^\d{10}$/, 'slot deve ter 10 dígitos').optional(),
      footer: z.string().regex(/^\d{10}$/, 'slot deve ter 10 dígitos').optional(),
    }).default({}),
    // Opt-in explícito para rotas CONDITIONAL (INV-ADS-06).
    // Default = no-ad. Formato canônico: sem leading/trailing slash, kebab-case.
    // Exemplo válido: ['contato', 'quanto-custa']. Inválido: ['/contato', 'contato/'].
    routesAllowed: z.array(
      z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'route deve ser kebab-case sem barras')
    ).default([]),
  }).optional(),
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
export type CrossLinkItem = { href: string; anchor: string; context: 'footer' | 'article' | 'cta' | 'resultado' };
