import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { isLocale } from '@/i18n/config';
import { getT } from '@/i18n/server';
import { buildAlternates } from '@/i18n/routing';
import { db } from '@/server/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';

export const dynamic = 'force-dynamic'; // reads the DB status; the real home page (Stage 2) will be cached/ISR

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) return {};
  return { alternates: buildAlternates(params.locale, '/') };
}

async function dbReachable(): Promise<boolean> {
  try { await db.$queryRaw`SELECT 1`; return true; } catch { return false; }
}

export default async function StatusPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const t = getT(params.locale);
  const ok = await dbReachable();
  return (
    <div className="container py-12 sm:py-20">
      <div className="mx-auto max-w-2xl animate-fade-up text-center">
        <Badge tone="brand">{t('status.badge')}</Badge>
        <h1 className="h-display mt-4">{t('status.title')}</h1>
        <p className="mt-4 text-fg-muted">{t('status.body')}</p>
        <Card className="mt-8 text-left">
          <CardBody className="flex items-center gap-3">
            {ok ? <CheckCircle2 className="h-5 w-5 text-success" aria-hidden /> : <XCircle className="h-5 w-5 text-danger" aria-hidden />}
            <p className="text-sm"><span className="font-semibold">{t('status.dbLabel')}:</span> {ok ? t('status.dbOk') : t('status.dbDown')}</p>
          </CardBody>
        </Card>
        <p className="mt-6 text-sm text-fg-muted">{t('status.next')}</p>
      </div>
    </div>
  );
}
