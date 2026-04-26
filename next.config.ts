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

// Sentry wrap — opcional via SENTRY_ENABLED=1 + presenca de @sentry/nextjs
// Em static export desabilitamos webpack server plugin (CL-633).
function withSentryIfAvailable(config: NextConfig): NextConfig {
  if (process.env.SENTRY_ENABLED !== '1') return config;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withSentryConfig } = require('@sentry/nextjs');
    return withSentryConfig(config, {
      silent: true,
      widenClientFileUpload: true,
      disableServerWebpackPlugin: true,
      hideSourceMaps: true,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT ?? 'micro-sites',
    });
  } catch {
    // Pacote nao instalado — segue sem Sentry. Build nao falha.
    return config;
  }
}

export default withSentryIfAvailable(nextConfig);
