import Link from 'next/link';
import { Logo } from './logo';
import { LanguageSwitcher } from './language-switcher';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { localizePath } from '@/i18n/routing';
import { getT } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

// Stage 1 header: only controls that actually work. Login / partner / search entries arrive with their pages.
export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getT(locale);
  return (
    <header className="sticky top-0 z-40 border-b bg-bg/90 pt-safe backdrop-blur">
      <div className="container flex min-h-16 items-center justify-between gap-3">
        <Link href={localizePath(locale, '/')} aria-label={t('app.name')} className="rounded-md"><Logo name={t('app.name')} /></Link>
        <div className="flex items-center gap-2">
          <InstallPrompt />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
