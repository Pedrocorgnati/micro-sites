// Sentry edge config — middleware/edge runtime (placeholder por static export)
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const release = process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? 'micro-sites@dev';

if (dsn) {
  Sentry.init({
    dsn,
    release,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'production',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
