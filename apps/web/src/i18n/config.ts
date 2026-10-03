export const locales = ["de", "en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export const localeNames: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
};

export const localeFlags: Record<Locale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  fr: "🇫🇷",
};

export const STORAGE_KEY = "mrk-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
