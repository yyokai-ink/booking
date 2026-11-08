import Link from 'next/link';
import { getT } from '@/i18n/server';
import { localizePath } from '@/i18n/routing';
import type { Locale } from '@/i18n/config';

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getT(locale);
  return (
    <footer className="mt-16 border-t pb-safe">
      <div className="container flex flex-col gap-3 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}</p>
        <Link href={localizePath(locale, '/design-system')} className="min-h-touch inline-flex items-center hover:text-fg">{t('nav.designSystem')}</Link>
      </div>
    </footer>
  );
}
