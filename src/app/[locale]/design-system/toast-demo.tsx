'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n/client';

export function ToastDemo() {
  const toast = useToast();
  const t = useT();
  return <Button variant="secondary" onClick={() => toast(t('ds.toastBody'), 'success')}>{t('ds.toast')}</Button>;
}
