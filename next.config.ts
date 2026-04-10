import type { NextConfig } from 'next';

// Suporte a build por site: SITE_SLUG=c01-site-institucional-pme npm run build
// Output: dist/{SITE_SLUG}/ para deploy independente por branch
const siteSlug = process.env.SITE_SLUG;

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  distDir: siteSlug ? `dist/${siteSlug}` : 'dist',

  // Oculta header X-Powered-By (segurança)
  poweredByHeader: false,


};

export default nextConfig;
