// src/schemas/__tests__/blog.test.ts
import { describe, it, expect } from 'vitest';
import { BlogArticleFrontmatterSchema, ContactFormSchema, WaitlistFormSchema } from '@/schemas';

describe('BlogArticleFrontmatterSchema', () => {
  it('aceita frontmatter válido', () => {
    expect(() => BlogArticleFrontmatterSchema.parse({
      slug: 'quanto-custa-criar-site',
      title: 'Quanto custa criar um site em 2026: guia completo',
      description: 'Descubra os preços reais para criar um site em 2026, desde landing pages simples até sistemas complexos com muito mais detalhes.',
      date: '2026-04-01',
      author: 'Pedro Corgnati',
    })).not.toThrow();
  });

  it('rejeita date com formato inválido (DD/MM/YYYY)', () => {
    const result = BlogArticleFrontmatterSchema.safeParse({
      slug: 'meu-artigo',
      title: 'B'.repeat(20),
      description: 'C'.repeat(50),
      date: '01/04/2026',
      author: 'Autor',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita slug com espaços', () => {
    const result = BlogArticleFrontmatterSchema.safeParse({
      slug: 'meu artigo invalido',
      title: 'B'.repeat(20),
      description: 'C'.repeat(50),
      date: '2026-04-01',
      author: 'Autor',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita title menor que 20 chars', () => {
    const result = BlogArticleFrontmatterSchema.safeParse({
      slug: 'meu-artigo',
      title: 'Curto',
      description: 'C'.repeat(50),
      date: '2026-04-01',
      author: 'Autor',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita description menor que 50 chars', () => {
    const result = BlogArticleFrontmatterSchema.safeParse({
      slug: 'meu-artigo',
      title: 'T'.repeat(20),
      description: 'Desc curta',
      date: '2026-04-01',
      author: 'Autor',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita tags com mais de 5 itens', () => {
    const result = BlogArticleFrontmatterSchema.safeParse({
      slug: 'meu-artigo',
      title: 'T'.repeat(20),
      description: 'D'.repeat(50),
      date: '2026-04-01',
      author: 'Autor',
      tags: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(result.success).toBe(false);
  });
});

describe('ContactFormSchema', () => {
  it('aceita formulário válido', () => {
    expect(() => ContactFormSchema.parse({
      name: 'João Silva',
      email: 'joao@empresa.com.br',
      message: 'Quero criar um site para minha empresa e preciso de um orçamento.',
      consent: true,
      honeypot: '',
    })).not.toThrow();
  });

  it('rejeita consent=false (LGPD)', () => {
    const result = ContactFormSchema.safeParse({
      name: 'João',
      email: 'j@email.com',
      message: 'Mensagem com mais de 10 caracteres aqui.',
      consent: false,
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error)).toContain('LGPD');
  });

  it('rejeita honeypot preenchido (bot)', () => {
    const result = ContactFormSchema.safeParse({
      name: 'Bot',
      email: 'b@b.com',
      message: 'Mensagem de bot aqui com conteúdo suficiente.',
      consent: true,
      honeypot: 'preenchido',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita email inválido', () => {
    const result = ContactFormSchema.safeParse({
      name: 'João',
      email: 'nao-e-email',
      message: 'Mensagem longa o suficiente aqui.',
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita mensagem com menos de 10 chars', () => {
    const result = ContactFormSchema.safeParse({
      name: 'João',
      email: 'j@email.com',
      message: 'curta',
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita nome com menos de 2 chars', () => {
    const result = ContactFormSchema.safeParse({
      name: 'J',
      email: 'j@email.com',
      message: 'Mensagem longa o suficiente aqui para teste.',
      consent: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('WaitlistFormSchema', () => {
  it('aceita formulário de waitlist válido', () => {
    expect(() => WaitlistFormSchema.parse({
      name: 'Maria Santos',
      email: 'maria@startup.com',
      company: 'Startup XYZ',
      consent: true,
      honeypot: '',
    })).not.toThrow();
  });

  it('rejeita consent=false na waitlist (LGPD)', () => {
    const result = WaitlistFormSchema.safeParse({
      name: 'João',
      email: 'j@email.com',
      consent: false,
    });
    expect(result.success).toBe(false);
  });

  it('aceita waitlist sem company (opcional)', () => {
    expect(() => WaitlistFormSchema.parse({
      name: 'Maria Santos',
      email: 'maria@startup.com',
      consent: true,
    })).not.toThrow();
  });

  it('rejeita honeypot preenchido na waitlist', () => {
    const result = WaitlistFormSchema.safeParse({
      name: 'Bot',
      email: 'bot@spam.com',
      consent: true,
      honeypot: 'spam',
    });
    expect(result.success).toBe(false);
  });
});
