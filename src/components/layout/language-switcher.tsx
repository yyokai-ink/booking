'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { locales, localeMeta } from '@/i18n/config';
import { useI18n } from '@/i18n/client';
import { localizePath, splitLocale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? '/';
  const { path } = splitLocale(pathname);
  return (
    <nav aria-label={t('common.language')} className="flex items-center gap-1 rounded-full border bg-surface p-1">
      <Globe className="ml-2 h-4 w-4 text-fg-muted" aria-hidden />
      {locales.map((l) => (
        <Link
          key={l} href={localizePath(l, path)} hrefLang={l} lang={l} prefetch={false}
          aria-current={l === locale ? 'true' : undefined}
          className={cn('inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold', l === locale ? 'bg-brand text-brand-fg' : 'text-fg-muted hover:bg-muted')}
        >
          {l.toUpperCase()}<span className="sr-only"> — {localeMeta[l].label}</span>
        </Link>
      ))}
    </nav>
  );
}
