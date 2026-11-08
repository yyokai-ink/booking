import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import '@/styles/globals.css';
import { isLocale, locales, localeMeta } from '@/i18n/config';
import { I18nProvider } from '@/i18n/client';
import { getT } from '@/i18n/server';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ToastProvider } from '@/components/ui/toast';
import { PwaRegister } from '@/components/pwa/pwa-register';

const font = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-sans', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // lets us use env(safe-area-inset-*) on iPhone
  themeColor: '#3f2563',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = getT(params.locale);
  return {
    metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
    title: { default: t('app.name'), template: `%s · ${t('app.name')}` },
    description: t('app.tagline'),
    applicationName: t('app.name'),
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: t('app.name'), statusBarStyle: 'default' },
    formatDetection: { telephone: false },
    icons: { icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/icons/icon.svg', type: 'image/svg+xml' }], apple: '/icons/apple-touch-icon.png' },
    openGraph: { type: 'website', siteName: t('app.name'), locale: localeMeta[params.locale].ogLocale, title: t('app.name'), description: t('app.tagline') },
  };
}

export default function RootLocaleLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const t = getT(locale);
  return (
    <html lang={locale} className={font.variable}>
      <body>
        <I18nProvider locale={locale}>
          <ToastProvider>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg">
              {t('common.skipToContent')}
            </a>
            <SiteHeader locale={locale} />
            <main id="main">{children}</main>
            <SiteFooter locale={locale} />
            <PwaRegister />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
