"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// ============================================================
// Context
// ============================================================

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const value = React.useMemo(
    () => ({ toasts, addToast, removeToast, clearToasts }),
    [toasts, addToast, removeToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useToastContext(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within <ToastProvider>");
  return ctx;
}

// ============================================================
// Viewport
// ============================================================

function ToastViewport() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {ctx.toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => ctx.removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// ============================================================
// Item
// ============================================================

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof Info; className: string; iconClass: string }
> = {
  default: {
    icon: Info,
    className: "border-border bg-card",
    iconClass: "text-muted-foreground",
  },
  success: {
    icon: CheckCircle2,
    className: "border-accent-200 bg-accent-50 dark:border-accent-800 dark:bg-accent-950/40",
    iconClass: "text-accent-600 dark:text-accent-400",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40",
    iconClass: "text-red-600 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    className: "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40",
    iconClass: "text-brand-600 dark:text-brand-400",
  },
};

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const variant = VARIANT_STYLES[toast.variant];
  const Icon = variant.icon;

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto rounded-xl border shadow-lg p-4 flex items-start gap-3",
        "animate-in slide-in-from-bottom-2 fade-in-0 duration-200",
        variant.className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", variant.iconClass)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onClose();
            }}
            className="text-xs font-medium text-brand-600 hover:underline mt-2"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 shrink-0 transition"
        aria-label="Schließen"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
