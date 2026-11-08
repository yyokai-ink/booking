'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createT, type TFunction } from './translate';
import { localeMeta, type Locale } from './config';

interface Ctx { locale: Locale; t: TFunction; intl: string }
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<Ctx>(() => ({ locale, t: createT(locale), intl: localeMeta[locale].intl }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}
