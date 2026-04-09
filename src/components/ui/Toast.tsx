'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  addToast: (variant: ToastVariant, message: string) => void;
}

// ============================================================
// Context
// ============================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ============================================================
// Provider
// ============================================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((variant: ToastVariant, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notificações"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ============================================================
// Single Toast Item
// ============================================================

const VARIANTS = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const v = VARIANTS[toast.variant];
  const Icon = v.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-md',
        'pointer-events-auto animate-slide-up',
        v.bg,
        v.border,
      )}
      role="alert"
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', v.iconColor)} aria-hidden="true" />
      <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -mt-2 -mr-2 rounded text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fechar notificação"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
