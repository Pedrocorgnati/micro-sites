import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { CookieConsent } from '@/components/lgpd/CookieConsent';
import { GA4Loader } from '@/components/lgpd/GA4Loader';
import { GA4Preconnect } from '@/components/lgpd/GA4Preconnect';
import { WebVitalsReporter } from '@/components/lgpd/WebVitalsReporter';
import { AdSenseLoader } from '@/components/ads/AdSenseLoader';
import { loadSiteConfig } from '@/lib/config-loader';
import { resolveAdsenseRuntime } from '@/lib/adsense';
import { CATEGORY_THEME_COLORS, DEFAULT_THEME_COLOR } from '@/lib/constants';
// Camada 2: import condicional — eliminado pelo bundler em produção
import { DevOverlayWrapper } from '@/components/dev/DevOverlayWrapper';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  display: 'swap',
});

const SITE_SLUG = process.env.SITE_SLUG ?? 'c01-site-institucional-pme';
const config = loadSiteConfig(SITE_SLUG);
const GA4_ID = config.gaId ?? process.env.NEXT_PUBLIC_GA4_ID;
// ADS-13/14: AdSense runtime resolvido server-side (env-driven via NEXT_PUBLIC_ADSENSE_CLIENT_ID).
const ADSENSE_RUNTIME = resolveAdsenseRuntime();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: CATEGORY_THEME_COLORS[config.category] ?? DEFAULT_THEME_COLOR,
};

export const metadata: Metadata = {
  title: {
    default: config.seo.title,
    template: `%s | ${config.name}`,
  },
  description: config.seo.description,
  keywords: config.seo.keywords,
  // TASK-6 intake-review (CL-331): variantes completas de favicon por site.
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'manifest', url: '/site.webmanifest' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: config.name,
    statusBarStyle: 'default',
  },
  alternates: config.hasBlog
    ? { types: { 'application/rss+xml': [{ url: '/rss.xml', title: `${config.name} RSS` }] } }
    : undefined,
  openGraph: {
    title: config.seo.title,
    description: config.seo.description,
    images: config.seo.ogImage ? [config.seo.ogImage] : [],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: config.seo.title,
    description: config.seo.description,
    images: config.seo.ogImage ? [config.seo.ogImage] : [],
  },
  robots: config.seo.noindex ? { index: false, follow: false } : { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-category={config.category}
      className={`${inter.variable} ${plusJakartaSans.variable} h-full`}
    >
      <head>
        {/* CL-635 — preconnect para Static Forms (sempre essencial) */}
        <link rel="preconnect" href="https://api.staticforms.xyz" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.staticforms.xyz" />
        {/* CL-635 — preconnect GA4 condicional ao consent */}
        {GA4_ID && <GA4Preconnect />}
        {/* ADS-14 — preconnect AdSense é injetado pelo AdSenseLoader client-side
            apos consent.advertising para nao furar INV-ADS-08 (zero requests sem consent). */}
      </head>
      <body className="min-h-full flex flex-col antialiased" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-white focus:text-sm focus:font-medium"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Pular para o conteúdo
        </a>
        <ToastProvider>
          {children}
        </ToastProvider>

        <CookieConsent siteSlug={SITE_SLUG} />
        {GA4_ID && <GA4Loader gaId={GA4_ID} category={config.category} />}
        {GA4_ID && <WebVitalsReporter />}
        {/* ADS-13 — AdSense script loader (condicional a env + consent.advertising + rota elegivel) */}
        {ADSENSE_RUNTIME.enabled && (
          <AdSenseLoader clientId={ADSENSE_RUNTIME.clientId} config={config} />
        )}
        {process.env.NODE_ENV === 'development' && <DevOverlayWrapper />}
      </body>
    </html>
  );
}
