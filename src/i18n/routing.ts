import { defaultLocale, isLocale, locales, localeMeta, type Locale } from './config';

/** "/uk/cities/lviv" -> { locale: 'uk', path: '/cities/lviv' } */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const [, first = '', ...rest] = pathname.split('/');
  if (isLocale(first)) return { locale: first, path: '/' + rest.join('/') };
  return { locale: null, path: pathname || '/' };
}

export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/** hreflang map for Next metadata `alternates.languages` (+ x-default). */
export function buildAlternates(locale: Locale, path: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizePath(l, path);
  languages['x-default'] = localizePath(defaultLocale, path);
  return { canonical: localizePath(locale, path), languages };
}

export function pickLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;
  const wanted = header
    .split(',')
    .map((part) => {
      const [tag = '', q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    const base = tag.split('-')[0];
    const match = locales.find((l) => l === base || localeMeta[l].intl.toLowerCase() === tag);
    if (match) return match;
  }
  return defaultLocale;
}
