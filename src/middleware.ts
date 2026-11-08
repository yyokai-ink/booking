import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, defaultLocale, isLocale } from '@/i18n/config';
import { pickLocaleFromAcceptLanguage } from '@/i18n/routing';

// Every public page lives under /<locale>/…  A bare path is redirected to the user's language.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const first = pathname.split('/')[1];

  if (isLocale(first)) {
    const res = NextResponse.next();
    if (req.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    }
    return res;
  }

  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : pickLocaleFromAcceptLanguage(req.headers.get('accept-language')) ?? defaultLocale;
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API, Next internals, and any file with an extension (icons, manifest, sw.js, images…).
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
