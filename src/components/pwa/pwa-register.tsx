'use client';

import { useEffect } from 'react';

/** Registers the service worker in production only (a SW in dev causes stale-cache confusion). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => console.warn('SW registration failed', err));
  }, []);
  return null;
}
