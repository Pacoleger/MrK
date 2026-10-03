"use client";

import { useI18n } from "./provider";

/**
 * Convenience hook – returns the current translation dictionary.
 * Usage: const t = useT(); t.common.login
 */
export function useT() {
  return useI18n().t;
}

/**
 * Convenience hook – returns the current locale + setter.
 * Usage: const { locale, setLocale } = useLocale();
 */
export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
