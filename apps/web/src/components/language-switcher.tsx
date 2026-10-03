"use client";

import * as React from "react";
import { Check, Globe } from "lucide-react";
import {
  locales,
  localeFlags,
  localeNames,
  type Locale,
} from "@/i18n/config";
import { useLocale, useT } from "@/i18n/use-translation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.language.change}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          {localeFlags[locale]} {locale.toUpperCase()}
        </span>
      </Button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card shadow-lg overflow-hidden z-50 animate-in fade-in-0 zoom-in-95"
        >
          {locales.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={l === locale}
              onClick={() => handleSelect(l)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition",
                l === locale && "bg-muted/60 font-medium"
              )}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{localeFlags[l]}</span>
                <span>{localeNames[l]}</span>
              </span>
              {l === locale && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
