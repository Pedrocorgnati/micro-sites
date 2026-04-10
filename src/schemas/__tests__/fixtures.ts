// src/schemas/__tests__/fixtures.ts
import type { SiteConfigInput } from '@/schemas/config';

export const validCatDConfig: SiteConfigInput = {
  slug: 'd01-calculadora-custo-site',
  name: 'Calculadora de Custo de Site',
  category: 'D',
  accentColor: '#7C3AED',
  wave: 1,
  funnelStage: 'consideration',
  template: 'calculator',
  hasBlog: true,
  schema: ['Organization', 'FAQPage'],
  seo: {
    title: 'Calculadora de Custo de Site 2026',
    description: 'Descubra quanto custa criar seu site com nossa calculadora gratuita. Resultado em menos de 5 minutos.',
    keywords: ['custo site', 'preço site', 'quanto custa site'],
  },
  cta: {
    primaryLabel: 'Ver resultado completo',
    formEndpoint: 'https://api.staticforms.xyz/submit',
    whatsappNumber: '5511999999999',
    whatsappMessage: 'Olá! Calculei o custo do meu site e quero conversar.',
  },
  leadMagnet: {
    enabled: true,
    type: 'calculator',
    partialResultLabel: 'Seu orçamento estimado',
    fullResultPath: '/resultado',
  },
  showSystemForgeLogo: true,
};

export const validCatCConfig: SiteConfigInput = {
  ...validCatDConfig,
  slug: 'c01-site-institucional-pme',
  name: 'Criação de Site Institucional para PME',
  category: 'C',
  accentColor: '#059669',
  template: 'landing',
  funnelStage: 'decision',
  hasBlog: false,
  schema: ['Organization', 'FAQPage', 'HowTo'],
  seo: {
    title: 'Site Institucional para PME — SystemForge',
    description: 'Criação de site institucional profissional para pequenas e médias empresas. Entrega em 7 dias.',
    keywords: ['site institucional', 'site pme', 'criação de site'],
  },
  leadMagnet: undefined,
};

export const validCatEConfig: SiteConfigInput = {
  ...validCatDConfig,
  slug: 'e01-ia-para-pequenos-negocios',
  name: 'IA para Pequenos Negócios',
  category: 'E',
  accentColor: '#0891B2',
  template: 'waitlist',
  funnelStage: 'awareness',
  hasBlog: false,
  schema: ['Organization', 'Product'],
  seo: {
    title: 'IA para Pequenos Negócios — Lista de Espera',
    description: 'Automatize seu negócio com inteligência artificial. Soluções acessíveis para pequenas empresas. Entre na lista.',
    keywords: ['ia para negócios', 'automação pme'],
  },
  leadMagnet: undefined,
};

export const validCatAConfig: SiteConfigInput = {
  ...validCatDConfig,
  slug: 'a01-clinicas-estetica',
  name: 'Clínicas de Estética — Site Profissional',
  category: 'A',
  accentColor: '#2563EB',
  template: 'landing',
  funnelStage: 'consideration',
  hasBlog: false,
  schema: ['LocalBusiness', 'FAQPage'],
  seo: {
    title: 'Site para Clínica de Estética — SystemForge',
    description: 'Site profissional para clínicas de estética. Design moderno, SEO otimizado e focado em conversão.',
    keywords: ['site clínica estética', 'site estética'],
  },
  leadMagnet: undefined,
};
