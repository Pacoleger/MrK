"use client";

import { useToastContext } from "@/components/ui/toast";
import type { ToastVariant } from "@/components/ui/toast";

/**
 * Globaler Toast-Hook.
 * Usage:
 *   const toast = useToast();
 *   toast.success("Gespeichert!", "Die Änderungen wurden übernommen.");
 */
export function useToast() {
  const ctx = useToastContext();

  const show = (
    title: string,
    description?: string,
    variant: ToastVariant = "default",
    duration = 5000
  ) => {
    return ctx.addToast({ title, description, variant, duration });
  };

  return {
    toasts: ctx.toasts,
    clear: ctx.clearToasts,
    remove: ctx.removeToast,
    show,
    success: (title: string, description?: string, duration?: number) =>
      show(title, description, "success", duration),
    error: (title: string, description?: string, duration?: number) =>
      show(title, description, "error", duration ?? 7000),
    warning: (title: string, description?: string, duration?: number) =>
      show(title, description, "warning", duration),
    info: (title: string, description?: string, duration?: number) =>
      show(title, description, "info", duration),
  };
}
