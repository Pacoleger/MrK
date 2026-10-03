"use client";

import * as React from "react";
import {
  defaultLocale,
  isLocale,
  STORAGE_KEY,
  type Locale,
} from "./config";
import de from "./messages/de.json";
import en from "./messages/en.json";
import fr from "./messages/fr.json";

const dictionaries = { de, en, fr } as const;

export type Dictionary = typeof de;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(defaultLocale);
  const [mounted, setMounted] = React.useState(false);

  // Read persisted locale after mount (avoids SSR hydration mismatch)
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
    } else {
      const browserLang = window.navigator.language.slice(0, 2);
      if (isLocale(browserLang)) {
        setLocaleState(browserLang);
      }
    }
    setMounted(true);
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  React.useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within <I18nProvider>");
  }
  return ctx;
}
