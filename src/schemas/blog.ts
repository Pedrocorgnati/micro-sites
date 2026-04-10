// src/schemas/blog.ts
// Schemas de artigos de blog e formulários LGPD
import { z } from 'zod';

export const BlogArticleFrontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve ser kebab-case'),
  title: z.string().min(20, 'Título deve ter ao menos 20 chars').max(100),
  description: z.string().min(50, 'Descrição deve ter ao menos 50 chars').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  author: z.string().min(2, 'Autor obrigatório'),
  tags: z.array(z.string()).max(5).optional(),
  readingTime: z.number().positive().optional(),
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
