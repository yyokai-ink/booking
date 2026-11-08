// Money is ALWAYS stored as integer minor units + ISO currency code.
export function minorUnitDigits(currency: string, intlLocale = 'en'): number {
  return new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

export function formatMoney(amountMinor: number, currency: string, intlLocale: string): string {
  const digits = minorUnitDigits(currency, intlLocale);
  const value = amountMinor / 10 ** digits;
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(value);
}
