import { createT } from './translate';
import type { Locale } from './config';

export function getT(locale: Locale) {
  return createT(locale);
}
