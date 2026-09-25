'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { CheckCircle2, HardDrive, WifiOff, Wifi, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  notifyStoredLocally: (customMessage?: string) => void;
  notifyOffline: () => void;
  notifyOnline: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastNotifyTimeRef = useRef<Record<string, number>>({});
  const { language, t } = useLanguage();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      // Deduplicate identical messages triggered within 3.5 seconds
      const key = `${toast.type}_${toast.message}`;
      const now = Date.now();
      const lastTime = lastNotifyTimeRef.current[key] || 0;
      if (now - lastTime < 3500) {
        return; // Prevent repeated spam
      }
      lastNotifyTimeRef.current[key] = now;

      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const duration = toast.durationMs || 4500;

      const newToast: ToastItem = {
        ...toast,
        id,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  // Automatic notification when data is saved locally to IndexedDB/localStorage
  const notifyStoredLocally = useCallback(
    (customMessage?: string) => {
      showToast({
        type: 'success',
        title: t.offline?.storedLocallyTitle || 'Information Stored Locally',
        message:
          customMessage ||
          t.offline?.storedLocallyDesc ||
          'Information has been stored locally. You can access it even if the network connection is unavailable.',
        durationMs: 5000,
      });
    },
    [showToast, t]
  );

  // Notification when network goes offline
  const notifyOffline = useCallback(() => {
    showToast({
      type: 'warning',
      title: language === 'mr' ? 'ऑफलाइन मोड (Offline)' : 'Working Offline',
      message:
        t.offline?.offlineNotice ||
        'Network connection is unavailable. Locally stored information is still accessible.',
      durationMs: 5000,
    });
  }, [showToast, language, t]);

  // Notification when network returns online
  const notifyOnline = useCallback(() => {
    showToast({
      type: 'info',
      title: language === 'mr' ? 'ऑनलाइन कनेक्शन पूर्ववत (Online)' : 'Connection Restored',
      message:
        t.offline?.onlineNotice ||
        'Network connection restored. Normal online synchronization resumed.',
      durationMs: 4000,
    });
  }, [showToast, language, t]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        notifyStoredLocally,
        notifyOffline,
        notifyOnline,
      }}
    >
      {children}

      {/* Clean Global Toast Notifications Banner / Container */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '460px',
          width: 'calc(100% - 32px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = '#ffffff';
          let border = '#0d9488';
          let iconColor = '#0d9488';
          let IconComponent = CheckCircle2;

          if (toast.type === 'success') {
            bg = '#f0fdf4';
            border = '#16a34a';
            iconColor = '#15803d';
            IconComponent = HardDrive;
          } else if (toast.type === 'warning') {
            bg = '#fffbeb';
            border = '#d97706';
            iconColor = '#b45309';
            IconComponent = WifiOff;
          } else if (toast.type === 'info') {
            bg = '#f0fdfa';
            border = '#0d9488';
            iconColor = '#0f766e';
            IconComponent = Wifi;
          } else if (toast.type === 'error') {
            bg = '#fef2f2';
            border = '#dc2626';
            iconColor = '#b91c1c';
            IconComponent = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                color: '#1e293b',
              }}
            >
              <div
                style={{
                  marginTop: '2px',
                  color: iconColor,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComponent size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      color: '#0f172a',
                      marginBottom: '2px',
                    }}
                  >
                    {toast.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '0.8rem',
                    lineHeight: '1.35',
                    color: '#334155',
                    fontWeight: 500,
                  }}
                >
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
