import uk from './messages/uk.json';
import en from './messages/en.json';
import type { Locale } from './config';

export type Messages = { [key: string]: string | Messages };

export const dictionaries: Record<Locale, Messages> = { uk, en };
