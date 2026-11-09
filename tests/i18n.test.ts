import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { locales, defaultLocale } from '@/i18n/config';
import { dictionaries, type Messages } from '@/i18n/dictionaries';
import { createT } from '@/i18n/translate';
import { buildAlternates, localizePath, pickLocaleFromAcceptLanguage, splitLocale } from '@/i18n/routing';

function keys(obj: Messages, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [prefix + k] : keys(v, `${prefix}${k}.`)));
}

describe('message catalogs', () => {
  it('every configured locale has a catalog file and a dictionary entry', () => {
    for (const l of locales) {
      expect(existsSync(path.join(__dirname, '../src/i18n/messages', `${l}.json`))).toBe(true);
      expect(dictionaries[l]).toBeTruthy();
    }
  });
  it('all locales have exactly the same keys as the default locale (plural suffixes aside)', () => {
    const strip = (k: string) => k.replace(/\.(zero|one|two|few|many|other)$/, '');
    const ref = new Set(keys(dictionaries[defaultLocale]).map(strip));
    for (const l of locales) {
      const got = new Set(keys(dictionaries[l]).map(strip));
      expect([...ref].filter((k) => !got.has(k))).toEqual([]);
      expect([...got].filter((k) => !ref.has(k))).toEqual([]);
    }
  });
  it('catalog files contain no empty strings', () => {
    for (const l of locales) {
      const raw = JSON.parse(readFileSync(path.join(__dirname, '../src/i18n/messages', `${l}.json`), 'utf8')) as Messages;
      const flat = JSON.stringify(raw);
      expect(flat.includes('""')).toBe(false);
    }
  });
});

describe('language switching', () => {
  it('translates the same key differently per locale', () => {
    expect(createT('en')('common.save')).toBe('Save');
    expect(createT('uk')('common.save')).toBe('Зберегти');
  });
  it('interpolates params and falls back to the key when missing', () => {
    expect(createT('en')('does.not.exist')).toBe('does.not.exist');
    expect(createT('en')('plan.seats', { count: 1 })).toBe('1 active master');
  });
  it('uses Ukrainian plural categories', () => {
    const t = createT('uk');
    expect(t('plan.seats', { count: 1 })).toBe('1 активний майстер');
    expect(t('plan.seats', { count: 3 })).toBe('3 активні майстри');
    expect(t('plan.seats', { count: 5 })).toBe('5 активних майстрів');
  });
});

describe('locale routing & SEO', () => {
  it('splits and builds localized paths', () => {
    expect(splitLocale('/uk/cities/lviv')).toEqual({ locale: 'uk', path: '/cities/lviv' });
    expect(splitLocale('/xx/foo').locale).toBeNull();
    expect(localizePath('en', '/master/olena')).toBe('/en/master/olena');
    expect(localizePath('uk', '/')).toBe('/uk');
  });
  it('emits hreflang alternates for every locale plus x-default', () => {
    const a = buildAlternates('en', '/cities/kyiv/tattoo');
    expect(a.canonical).toBe('/en/cities/kyiv/tattoo');
    expect(a.languages['uk']).toBe('/uk/cities/kyiv/tattoo');
    expect(a.languages['x-default']).toBe(`/${defaultLocale}/cities/kyiv/tattoo`);
  });
  it('detects the locale from Accept-Language', () => {
    expect(pickLocaleFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    expect(pickLocaleFromAcceptLanguage('uk-UA,uk;q=0.9,en;q=0.5')).toBe('uk');
    expect(pickLocaleFromAcceptLanguage('de-DE,de;q=0.9')).toBe(defaultLocale);
    expect(pickLocaleFromAcceptLanguage(null)).toBe(defaultLocale);
  });
});
