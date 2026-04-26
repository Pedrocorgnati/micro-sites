// src/schemas/__tests__/config.test.ts
import { describe, it, expect } from 'vitest';
import { SiteConfigSchema } from '@/schemas';
import { validCatDConfig, validCatCConfig, validCatEConfig, validCatAConfig } from './fixtures';

describe('SiteConfigSchema', () => {
  describe('casos válidos', () => {
    it('aceita config Cat. D com leadMagnet', () => {
      expect(() => SiteConfigSchema.parse(validCatDConfig)).not.toThrow();
    });

    it('aceita config Cat. C (landing)', () => {
      expect(() => SiteConfigSchema.parse(validCatCConfig)).not.toThrow();
    });

    it('aceita config Cat. E com template waitlist', () => {
      expect(() => SiteConfigSchema.parse(validCatEConfig)).not.toThrow();
    });

    it('aceita config Cat. A (landing)', () => {
      expect(() => SiteConfigSchema.parse(validCatAConfig)).not.toThrow();
    });
  });

  describe('casos inválidos — seo', () => {
    it('rejeita title > 60 chars', () => {
      const cfg = { ...validCatDConfig, seo: { ...validCatDConfig.seo, title: 'A'.repeat(61) } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error)).toContain('60');
    });

    it('rejeita description > 155 chars', () => {
      const cfg = { ...validCatDConfig, seo: { ...validCatDConfig.seo, description: 'B'.repeat(156) } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita keywords com mais de 6 itens', () => {
      const cfg = { ...validCatDConfig, seo: { ...validCatDConfig.seo, keywords: ['a','b','c','d','e','f','g'] } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita keywords vazio (min 1)', () => {
      const cfg = { ...validCatDConfig, seo: { ...validCatDConfig.seo, keywords: [] } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita canonical não-URL', () => {
      const cfg = { ...validCatDConfig, seo: { ...validCatDConfig.seo, canonical: 'not-a-url' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });
  });

  describe('casos inválidos — cta', () => {
    it('rejeita whatsappNumber com letras', () => {
      const cfg = { ...validCatDConfig, cta: { ...validCatDConfig.cta, whatsappNumber: '+55-11-99999' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita formEndpoint não-URL', () => {
      const cfg = { ...validCatDConfig, cta: { ...validCatDConfig.cta, formEndpoint: 'not-a-url' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });
  });

  describe('casos inválidos — campos gerais', () => {
    it('rejeita category inválida', () => {
      const cfg = { ...validCatDConfig, category: 'Z' as never };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita wave inválida (valor 4)', () => {
      const cfg = { ...validCatDConfig, wave: 4 as never };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita template inválido', () => {
      const cfg = { ...validCatDConfig, template: 'unknown' as never };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita slug inválido (não está nos 36)', () => {
      const cfg = { ...validCatDConfig, slug: 'z99-inexistente' as never };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita accentColor não-hex', () => {
      const cfg = { ...validCatDConfig, accentColor: 'purple' };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita fullResultPath sem barra inicial', () => {
      const cfg = { ...validCatDConfig, leadMagnet: { ...validCatDConfig.leadMagnet!, fullResultPath: 'resultado' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita relatedSites com mais de 4 itens', () => {
      const cfg = {
        ...validCatDConfig,
        relatedSites: ['c01-site-institucional-pme','c02-landing-page-conversao','c03-app-web-negocio','c04-ecommerce-pequeno-negocio','c05-sistema-agendamento'] as never,
      };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });
  });

  describe('CL-143 — contactEmail obrigatório', () => {
    it('rejeita config sem contactEmail', () => {
      const { contactEmail, ...rest } = validCatDConfig;
      void contactEmail;
      const result = SiteConfigSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejeita contactEmail malformado', () => {
      const cfg = { ...validCatDConfig, contactEmail: 'not-an-email' };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita contactEmail em dominio de teste', () => {
      const cfg = { ...validCatDConfig, contactEmail: 'contato@example.com' };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });
  });

  describe('CL-387 — whatsappNumber hardening', () => {
    it('rejeita whatsapp placeholder 5511999999999', () => {
      const cfg = { ...validCatDConfig, cta: { ...validCatDConfig.cta, whatsappNumber: '5511999999999' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita whatsapp com DDD sem 55', () => {
      const cfg = { ...validCatDConfig, cta: { ...validCatDConfig.cta, whatsappNumber: '11988887777' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('rejeita whatsapp com formato curto (< 12 digitos)', () => {
      const cfg = { ...validCatDConfig, cta: { ...validCatDConfig.cta, whatsappNumber: '551199998' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
    });

    it('aceita whatsapp real 5512920043268 (13 digitos)', () => {
      const cfg = { ...validCatDConfig, cta: { ...validCatDConfig.cta, whatsappNumber: '5512920043268' } };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(true);
    });
  });

  describe('refinamentos', () => {
    it('rejeita Cat. D sem leadMagnet (refine)', () => {
      const cfg = { ...validCatDConfig, leadMagnet: undefined };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error)).toContain('leadMagnet');
    });

    it('rejeita Cat. E com template != waitlist (refine)', () => {
      const cfg = { ...validCatEConfig, template: 'landing' as const };
      const result = SiteConfigSchema.safeParse(cfg);
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error)).toContain('waitlist');
    });
  });
});
