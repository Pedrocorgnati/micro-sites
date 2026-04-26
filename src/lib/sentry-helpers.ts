// Helpers para instrumentacao Sentry com fallback no-op quando pacote ausente
// Permite que codigo seja escrito uma vez e funcione com ou sem @sentry/nextjs
// instalado em dev. Em prod o pacote e obrigatorio.

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
};

type SentryLike = {
  captureException: (err: unknown, ctx?: CaptureContext) => void;
  setTag: (key: string, value: string) => void;
  addBreadcrumb: (b: { category?: string; message?: string; level?: string; data?: Record<string, unknown> }) => void;
};

let cached: SentryLike | null = null;

function load(): SentryLike {
  if (cached) return cached;
  try {
    // Lazy require — em ambientes sem @sentry/nextjs (testes), retorna no-op
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@sentry/nextjs') as SentryLike;
    cached = mod;
  } catch {
    cached = {
      captureException: () => {},
      setTag: () => {},
      addBreadcrumb: () => {},
    };
  }
  return cached;
}

function readConsent(): boolean {
  if (typeof window === 'undefined') return true; // server: sem consent gate
  try {
    const raw = window.localStorage.getItem('cookie_consent');
    if (raw === 'accepted') return true;
    const json = raw ? JSON.parse(raw) : null;
    return json?.value === 'accepted';
  } catch {
    return false;
  }
}

export function captureCalculatorError(err: unknown, ctx: { slug?: string; step?: number; type?: string }) {
  if (!readConsent()) return;
  const sentry = load();
  sentry.captureException(err, {
    tags: {
      component: 'Calculator',
      site_slug: ctx.slug ?? 'unknown',
      calc_type: ctx.type ?? 'unknown',
    },
    extra: { step: ctx.step },
    fingerprint: ['calculator', ctx.type ?? 'unknown', ctx.slug ?? 'unknown'],
  });
}

export function captureResultadoParseError(err: unknown, urlContext: string) {
  if (!readConsent()) return;
  const sentry = load();
  sentry.captureException(err, {
    tags: { component: 'resultado', site_slug: process.env.NEXT_PUBLIC_SITE_SLUG ?? 'unknown' },
    extra: { url_context: urlContext.replace(/email=[^&]+/g, 'email=[redacted]') },
    fingerprint: ['resultado', 'parse-error'],
  });
}

export function setSentryContextTags(tags: Record<string, string>) {
  if (!readConsent()) return;
  const sentry = load();
  Object.entries(tags).forEach(([k, v]) => sentry.setTag(k, v));
}

export function captureRootError(err: unknown) {
  const sentry = load();
  sentry.captureException(err, {
    tags: { boundary: 'global-error' },
    fingerprint: ['global-error', '{{ default }}'],
  });
}
