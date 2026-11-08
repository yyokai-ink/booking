// Instants are stored in UTC; always render in an explicit IANA time zone (provider's city or user's zone).
export function formatDateTime(date: Date | string, intlLocale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(date));
}

export function formatDate(date: Date | string, intlLocale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: 'long', timeZone }).format(new Date(date));
}
