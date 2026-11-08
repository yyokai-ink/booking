'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/client';

type Tone = 'info' | 'success' | 'error';
interface ToastItem { id: number; message: string; tone: Tone }
const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((message: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, message, tone }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:items-end">
        {items.map((i) => (
          <div key={i.id} className={cn('pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-md border bg-surface p-3 text-sm shadow-pop',
            i.tone === 'success' && 'border-success/40', i.tone === 'error' && 'border-danger/40')}>
            <span className="flex-1">{i.message}</span>
            <button type="button" onClick={() => dismiss(i.id)} aria-label={t('common.close')} className="min-h-touch min-w-touch rounded-md hover:bg-muted"><X className="mx-auto h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
