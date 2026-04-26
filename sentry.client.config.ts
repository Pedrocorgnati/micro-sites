// Sentry browser/runtime config — gated por consent LGPD
// CL-028, CL-198, CL-509-512, CL-561 — sem PII, breadcrumbs custom, tags por slug
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const release = process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? 'micro-sites@dev';
const env = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production';

function readConsent(): 'accepted' | 'rejected' | 'unset' {
  if (typeof window === 'undefined') return 'unset';
  try {
    const raw = window.localStorage.getItem('cookie_consent');
    if (raw === 'accepted' || raw === 'rejected') return raw;
    const json = raw ? JSON.parse(raw) : null;
    if (json?.value === 'accepted' || json?.value === 'rejected') return json.value;
    return 'unset';
  } catch {
    return 'unset';
  }
}

if (dsn) {
  Sentry.init({
    dsn,
    release,
    environment: env,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    initialScope: {
      tags: {
        site_slug: process.env.NEXT_PUBLIC_SITE_SLUG ?? 'unknown',
        category: process.env.NEXT_PUBLIC_SITE_CATEGORY ?? 'unknown',
        wave: process.env.NEXT_PUBLIC_SITE_WAVE ?? 'unknown',
      },
    },
    beforeSend(event) {
      // Gating LGPD: descarta evento se usuario nao consentiu (Art 7 LGPD)
      if (readConsent() !== 'accepted') return null;
      // Sanitizacao defensiva — remove PII residual
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (readConsent() !== 'accepted') return null;
      // Drop breadcrumbs que possam vazar PII (ex.: form input values)
      if (breadcrumb.category === 'ui.input') return null;
      return breadcrumb;
    },
  });
}
