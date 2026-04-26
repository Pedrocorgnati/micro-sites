// src/schemas/blog.ts
// Schemas de artigos de blog e formulários LGPD
import { z } from 'zod';

export const BlogArticleFrontmatterSchema = z.object({
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .describe('URL slug em kebab-case'),
  title: z.string()
    .min(10, 'Título deve ter pelo menos 10 caracteres')
    .max(60, 'Título deve ter no máximo 60 caracteres (SEO)')
    .describe('Título otimizado para SEO'),
  description: z.string()
    .min(50, 'Meta description deve ter pelo menos 50 caracteres')
    .max(155, 'Meta description deve ter no máximo 155 caracteres (SERP)')
    .describe('Meta description para search results'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar em formato YYYY-MM-DD')
    .describe('Data de publicação'),
  dateModified: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateModified deve estar em formato YYYY-MM-DD')
    .optional()
    .describe('Data da ultima modificacao (E-E-A-T). Default = date.'),
  author: z.string().default('SystemForge'),
  authorMeta: z.object({
    name: z.string().min(2),
    url: z.string().url().optional(),
  }).optional().describe('Metadata enriquecido do autor (Person schema)'),
  tags: z.array(z.string()).max(5).optional().default([]),
  readingTime: z.number().positive('Reading time deve ser positivo').optional(),
  category: z.enum(['SEO', 'Conversão', 'Performance', 'Ferramenta', 'Caso de Uso']).optional(),
  funnelStage: z.enum(['TOFU', 'MOFU', 'BOFU']).optional(),
  searchIntent: z.enum(['How-to', 'Comparison', 'Product', 'Local', 'News']).optional(),
  siteSlug: z.string().optional().describe('Site de origem (a01, c01-site-institucional-pme, etc.)'),
});

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\+?[\d\s\-()]{9,20}$/).optional(),
  message: z.string().min(10, 'Mensagem deve ter ao menos 10 caracteres').max(2000),
  consent: z.boolean().refine((v) => v === true, { message: 'Consentimento obrigatório (LGPD)' }),
  honeypot: z.string().max(0, 'Campo honeypot deve estar vazio').optional(),
});

export const WaitlistFormSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100),
  email: z.string().email('Email inválido'),
  company: z.string().max(100).optional(),
  consent: z.boolean().refine((v) => v === true, { message: 'Consentimento obrigatório (LGPD)' }),
  honeypot: z.string().max(0, 'Campo honeypot deve estar vazio').optional(),
});

export const CalculatorInputSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['select', 'radio', 'number', 'checkbox']),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    points: z.number().optional(),
  })).optional(),
  weight: z.number().positive().optional(),
});

export type BlogArticleFrontmatterInput = z.infer<typeof BlogArticleFrontmatterSchema>;
export type ContactFormInput = z.infer<typeof ContactFormSchema>;
export type WaitlistFormInput = z.infer<typeof WaitlistFormSchema>;
