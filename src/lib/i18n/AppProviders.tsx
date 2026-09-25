'use client';

import React, { ReactNode, useEffect } from 'react';
import { LanguageProvider } from './LanguageContext';
import { ToastProvider } from '@/lib/notifications/ToastContext';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] ServiceWorker registration failed:', err);
          });
      });
    }
  }, []);

  return (
    <LanguageProvider>
      <ToastProvider>{children}</ToastProvider>
    </LanguageProvider>
  );
}
