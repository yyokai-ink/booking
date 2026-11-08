import { defaultLocale, type Locale } from './config';
import { dictionaries, type Messages } from './dictionaries';

export type TParams = Record<string, string | number>;
export type TFunction = (key: string, params?: TParams) => string;

function lookup(dict: Messages, key: string): string | undefined {
  let node: string | Messages | undefined = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

/** Pure translator. Plurals: if params.count is set and "<key>.<one|few|many|other>" exists, it is used. */
export function createT(locale: Locale): TFunction {
  const dict = dictionaries[locale];
  const fallback = dictionaries[defaultLocale];
  const rules = new Intl.PluralRules(locale);
  return (key, params) => {
    let resolved = key;
    if (typeof params?.count === 'number') {
      const pluralKey = `${key}.${rules.select(params.count)}`;
      if (lookup(dict, pluralKey) !== undefined || lookup(fallback, pluralKey) !== undefined) resolved = pluralKey;
    }
    const raw = lookup(dict, resolved) ?? lookup(fallback, resolved) ?? key;
    return interpolate(raw, params);
  };
}
