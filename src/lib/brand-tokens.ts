/**
 * Tokens oficiais SystemForge (extraídos de system-forge-landing-page).
 * Usado no Footer e em elementos de co-branding.
 * Fonte: src/app/globals.css do landing page SF.
 */

export const SF_BRAND = {
  colors: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryForeground: '#FFFFFF',
    accent: '#BFDBFE',
    accentForeground: '#1E3A8A',
    primaryDark: '#3A82FF',
    accentDark: '#1E3A5F',
  },
  logo: {
    default: '/brand/sf-logo.webp',
    white: '/brand/sf-logo-white.webp',
    favicon: '/brand/sf-favicon.ico',
  },
  name: 'SystemForge',
  tagline: 'Desenvolvido por SystemForge',
  url: 'https://systemforge.com.br',
} as const;

export type SFBrand = typeof SF_BRAND;
