// To add a language (e.g. Polish):
//  1. add 'pl' to `locales` and an entry to `localeMeta`  (TypeScript forces both)
//  2. create src/i18n/messages/pl.json with the same keys as en.json (tests/i18n.test.ts checks parity)
//  3. register it in `dictionaries` in src/i18n/dictionaries.ts
//  4. insert a row into the "Language" table (or extend prisma/seed.ts)
export const locales = ['uk', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uk';

export const localeMeta: Record<Locale, { label: string; intl: string; ogLocale: string }> = {
  uk: { label: 'Українська', intl: 'uk-UA', ogLocale: 'uk_UA' },
  en: { label: 'English', intl: 'en-GB', ogLocale: 'en_GB' },
};

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
