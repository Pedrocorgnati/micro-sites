// Sentry server config — usado por scripts Node mesmo em static export
// (build time, scripts CLI). Em static export runtime nao executa server.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const release = process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? 'micro-sites@dev';
const env = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production';

if (dsn) {
  Sentry.init({
    dsn,
    release,
    environment: env,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    initialScope: {
      tags: {
        runtime: 'node-script',
        site_slug: process.env.SITE_SLUG ?? 'build',
      },
    },
  });
}
