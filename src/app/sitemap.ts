import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

// Stage 1: static routes only. Stage 2 appends cities×categories, masters and studios from the DB.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  return locales.map((l) => ({
    url: `${base}/${l}`,
    lastModified: new Date(),
    alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${base}/${x}`])) },
  }));
}
