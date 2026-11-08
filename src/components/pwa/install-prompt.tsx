'use client';

import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/client';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Chromium/Edge/Samsung Internet: native install via `beforeinstallprompt`.
 * iOS/iPadOS Safari has no install API — we show a one-line "Add to Home Screen" hint instead.
 * Firefox desktop does not support installing PWAs, so nothing is shown there.
 */
export function InstallPrompt() {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIos(isIos);
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (!deferred && !ios) return null;

  const install = async () => {
    if (deferred) { await deferred.prompt(); await deferred.userChoice; setDeferred(null); } else setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <Button variant="secondary" onClick={install} aria-expanded={ios ? open : undefined}>
        {ios ? <Share className="h-4 w-4" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
        <span className="hidden sm:inline">{t('pwa.install')}</span>
        <span className="sr-only sm:hidden">{t('pwa.install')}</span>
      </Button>
      {ios && open && (
        <div role="dialog" aria-label={t('pwa.installTitle')} className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-surface p-4 text-sm shadow-pop">
          <p className="font-semibold">{t('pwa.installTitle')}</p>
          <p className="mt-1 text-fg-muted">{t('pwa.iosHint')}</p>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setOpen(false)}>{t('pwa.dismiss')}</Button>
        </div>
      )}
    </div>
  );
}
