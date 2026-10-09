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

  // Stabile Referenzen auf Callbacks
  const onPromptRef = React.useRef(onPrompt);
  const onIdleRef = React.useRef(onIdle);
  const onActiveRef = React.useRef(onActive);

  React.useEffect(() => {
    onPromptRef.current = onPrompt;
    onIdleRef.current = onIdle;
    onActiveRef.current = onActive;
  }, [onPrompt, onIdle, onActive]);

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
    timeoutRef.current = setTimeout(() => {
      // Timeout erreicht → Warnung anzeigen
      isPromptingRef.current = true;
      setIsPrompting(true);
      onPromptRef.current();

      // Nach promptTimeout → Logout
      promptTimeoutRef.current = setTimeout(() => {
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
    if (disabled) return;

    // Wenn Warnung aktiv → Aktivität bestätigt
    if (isPromptingRef.current) {
      isPromptingRef.current = false;
      setIsPrompting(false);
      onActiveRef.current?.();
    }

    startTimer();
  }, [disabled, startTimer]);

  // ============================================================
  // Reset manuell (nach Login, "Weiter"-Klick, etc.)
  // ============================================================

  const reset = React.useCallback(() => {
    isPromptingRef.current = false;
    setIsPrompting(false);
    startTimer();
  }, [startTimer]);

  // ============================================================
  // Event-Listener
  // ============================================================

  React.useEffect(() => {
    if (disabled) {
      clearTimers();
      return;
    }

    startTimer();

    // Throttle Activity-Events (max alle 500ms)
    let lastActivity = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastActivity < 500) return;
      lastActivity = now;
      handleActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    // Cleanup
    return () => {
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
