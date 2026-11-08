import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getT } from '@/i18n/server';
import { buildAlternates } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastDemo } from './toast-demo';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) return {};
  return { title: getT(params.locale)('ds.title'), alternates: buildAlternates(params.locale, '/design-system'), robots: { index: false } };
}

const swatches = ['bg-bg', 'bg-surface', 'bg-muted', 'bg-brand', 'bg-brand-soft', 'bg-accent', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info'];

export default function DesignSystemPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const t = getT(params.locale);
  return (
    <div className="container space-y-12 py-10">
      <header>
        <h1 className="h-display">{t('ds.title')}</h1>
        <p className="mt-2 text-fg-muted">{t('ds.subtitle')}</p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-hidden>
          {swatches.map((c) => <li key={c} className={`h-10 w-10 rounded-full border ${c}`} />)}
        </ul>
      </header>

      <section className="space-y-4">
        <h2 className="h-section">{t('ds.buttons')}</h2>
        <div className="flex flex-wrap gap-3">
          <Button>{t('ds.primary')}</Button>
          <Button variant="secondary">{t('ds.secondary')}</Button>
          <Button variant="ghost">{t('ds.ghost')}</Button>
          <Button variant="danger">{t('ds.danger')}</Button>
          <Button loading>{t('ds.loadingBtn')}</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h-section">{t('ds.inputs')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('ds.emailLabel')} placeholder={t('ds.emailPlaceholder')} type="email" autoComplete="email" />
          <Input label={t('ds.emailLabel')} defaultValue="not-an-email" error={t('ds.emailError')} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h-section">{t('ds.feedback')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Alert tone="info">{t('ds.alertInfo')}</Alert>
          <Alert tone="success">{t('ds.alertSuccess')}</Alert>
          <Alert tone="error">{t('ds.alertError')}</Alert>
        </div>
        <ToastDemo />
      </section>

      <section className="space-y-4">
        <h2 className="h-section">{t('ds.cards')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <CardBody className="space-y-2">
              <Badge tone="brand">★ 4.9</Badge>
              <h3 className="font-bold">{t('ds.sampleCardTitle')}</h3>
              <p className="text-sm text-fg-muted">{t('ds.sampleCardBody')}</p>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
