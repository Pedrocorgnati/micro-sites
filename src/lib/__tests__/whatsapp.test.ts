// src/lib/__tests__/whatsapp.test.ts
// CL-387: ST003 — buildWhatsAppUrl rejeita numero vazio/invalido
import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl, WhatsAppConfigError } from '@/lib/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('throws WhatsAppConfigError quando phone e vazio', () => {
    expect(() => buildWhatsAppUrl('', 'ola')).toThrow(WhatsAppConfigError);
  });

  it('throws quando phone nao segue formato 55DDDXXXXXXXXX', () => {
    expect(() => buildWhatsAppUrl('123', 'ola')).toThrow(WhatsAppConfigError);
    expect(() => buildWhatsAppUrl('11988887777', 'ola')).toThrow(WhatsAppConfigError);
  });

  it('aceita numero valido 13 digitos (55 + DDD + 9 digitos)', () => {
    const url = buildWhatsAppUrl('5512920043268', 'ola');
    expect(url).toBe('https://wa.me/5512920043268?text=ola');
  });

  it('aceita numero valido 12 digitos (55 + DDD + 8 digitos)', () => {
    const url = buildWhatsAppUrl('551299900012', 'ola');
    expect(url).toContain('wa.me/551299900012');
  });

  it('normaliza caracteres nao-numericos (parenteses, espacos)', () => {
    const url = buildWhatsAppUrl('+55 (12) 92004-3268', 'ola');
    expect(url).toContain('wa.me/5512920043268');
  });

  it('acrescenta originTag quando slug e fornecido', () => {
    const url = buildWhatsAppUrl('5512920043268', 'ola', 'a01');
    expect(decodeURIComponent(url.split('?text=')[1])).toContain('[origem: a01]');
  });
});
