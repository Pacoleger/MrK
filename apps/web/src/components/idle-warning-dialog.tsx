"use client";

import * as React from "react";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IdleWarningDialog({
  secondsRemaining,
  onContinue,
  onLogout,
}: {
  secondsRemaining: number;
  onContinue: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/40 grid place-items-center mx-auto">
            <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold">Bist du noch da?</h2>
          <p className="text-sm text-muted-foreground">
            Du wirst in Kürze automatisch abgemeldet.
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center">
          <div className="text-5xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {secondsRemaining}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sekunden bis zur Abmeldung
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsRemaining / 60) * 100}%` }}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
          <Button
            onClick={onContinue}
            className="gap-2 bg-gradient-to-r from-brand-500 to-accent-500"
          >
            <RefreshCw className="h-4 w-4" />
            Weiter
          </Button>
        </div>
      </div>
    </div>
  );
}
