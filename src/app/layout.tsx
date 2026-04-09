import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { CookieConsent } from '@/components/lgpd/CookieConsent';
import { GA4Loader } from '@/components/lgpd/GA4Loader';
import { WebVitalsReporter } from '@/components/lgpd/WebVitalsReporter';
import { loadSiteConfig } from '@/lib/config-loader';
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

export const metadata: Metadata = {
  title: {
    default: config.seo.title,
    template: `%s | ${config.name}`,
  },
  description: config.seo.description,
  keywords: config.seo.keywords,
  openGraph: {
    title: config.seo.title,
    description: config.seo.description,
    images: config.seo.ogImage ? [config.seo.ogImage] : [],
    locale: 'pt_BR',
    type: 'website',
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
      <body className="min-h-full flex flex-col antialiased" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
        <ToastProvider>
          {children}
        </ToastProvider>

        <CookieConsent />
        {GA4_ID && <GA4Loader gaId={GA4_ID} />}
        {GA4_ID && <WebVitalsReporter />}
        {process.env.NODE_ENV === 'development' && <DevOverlayWrapper />}
      </body>
    </html>
  );
}
