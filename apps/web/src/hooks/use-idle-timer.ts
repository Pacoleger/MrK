"use client";

import * as React from "react";

// ============================================================
// Idle Timer Hook
// ============================================================

export interface UseIdleTimerOptions {
  /** Zeit in ms bis zur Warnung */
  timeout: number;
  /** Zeit in ms zwischen Warnung und Logout */
  promptTimeout: number;
  /** Callback bei Warnung */
  onPrompt: () => void;
  /** Callback bei Logout */
  onIdle: () => void;
  /** Callback bei Aktivität nach Warnung */
  onActive?: () => void;
  /** Events, die als Aktivität zählen */
  events?: string[];
  /** Deaktiviert den Timer komplett */
  disabled?: boolean;
}

export function useIdleTimer({
  timeout,
  promptTimeout,
  onPrompt,
  onIdle,
  onActive,
  events = [
    "mousemove",
    "mousedown",
    "keydown",
    "touchstart",
    "touchmove",
    "scroll",
    "click",
  ],
  disabled = false,
}: UseIdleTimerOptions) {
  const [isPrompting, setIsPrompting] = React.useState(false);

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isPromptingRef = React.useRef(false);
  const disabledRef = React.useRef(disabled);

  // Stabile Referenzen
  const onPromptRef = React.useRef(onPrompt);
  const onIdleRef = React.useRef(onIdle);
  const onActiveRef = React.useRef(onActive);

  React.useEffect(() => {
    onPromptRef.current = onPrompt;
    onIdleRef.current = onIdle;
    onActiveRef.current = onActive;
    disabledRef.current = disabled;
  }, [onPrompt, onIdle, onActive, disabled]);

  // ============================================================
  // Timer zurücksetzen
  // ============================================================

  const clearTimers = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
      promptTimeoutRef.current = null;
    }
  }, []);

  const startTimer = React.useCallback(() => {
    clearTimers();

    console.log(`[useIdleTimer] ⏱️  Timer startet für ${timeout / 1000}s`);

    timeoutRef.current = setTimeout(() => {
      console.log("[useIdleTimer] ⏰ Idle-Timeout erreicht → Warnung");
      isPromptingRef.current = true;
      setIsPrompting(true);
      onPromptRef.current();

      promptTimeoutRef.current = setTimeout(() => {
        console.log("[useIdleTimer] 🚪 Prompt-Timeout erreicht → Logout");
        isPromptingRef.current = false;
        setIsPrompting(false);
        onIdleRef.current();
      }, promptTimeout);
    }, timeout);
  }, [clearTimers, timeout, promptTimeout]);

  // ============================================================
  // Aktivität erkannt
  // ============================================================

  const handleActivity = React.useCallback(() => {
    if (disabledRef.current) return;

    // Wenn Warnung aktiv → Nutzer ist zurückgekommen
    if (isPromptingRef.current) {
      console.log("[useIdleTimer] ✅ Aktivität während Warnung");
      isPromptingRef.current = false;
      setIsPrompting(false);
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
        promptTimeoutRef.current = null;
      }
      onActiveRef.current?.();
    }

    startTimer();
  }, [startTimer]);

  // ============================================================
  // Manueller Reset
  // ============================================================

  const reset = React.useCallback(() => {
    console.log("[useIdleTimer] 🔄 Manuell zurückgesetzt");
    isPromptingRef.current = false;
    setIsPrompting(false);
    startTimer();
  }, [startTimer]);

  // ============================================================
  // Event-Listener
  // ============================================================

  React.useEffect(() => {
    if (disabled) {
      console.log("[useIdleTimer] ❌ Disabled");
      clearTimers();
      return;
    }

    console.log("[useIdleTimer] ▶️  Starte Timer");
    startTimer();

    let lastActivity = 0;
    const throttledHandler = () => {
      const now = Date.now();
      // Throttle: max alle 5s ein Reset
      if (now - lastActivity < 5000) return;
      lastActivity = now;
      handleActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      console.log("[useIdleTimer] 🛑 Cleanup");
      clearTimers();
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
    };
  }, [disabled, events, handleActivity, startTimer, clearTimers]);

  return {
    isPrompting,
    reset,
  };
}
