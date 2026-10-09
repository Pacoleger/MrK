"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useIdleTimer } from "@/hooks/use-idle-timer";
import { IdleWarningDialog } from "./idle-warning-dialog";

// ============================================================
// Konfiguration
// ============================================================

/** Inaktivität in ms bis zur Warnung (25 Minuten) */
const IDLE_TIMEOUT_MS = 25 * 60 * 1000;

/** Zeit in ms zwischen Warnung und Logout (60 Sekunden) */
const PROMPT_TIMEOUT_MS = 60 * 1000;

/** Wie oft der Countdown aktualisiert wird */
const COUNTDOWN_INTERVAL_MS = 1000;

// ============================================================
// Idle Manager
// ============================================================

export function IdleManager() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [secondsRemaining, setSecondsRemaining] = React.useState(
    PROMPT_TIMEOUT_MS / 1000
  );

  // Nur wenn eingeloggt
  const isLoggedIn = !!user;

  const handleIdle = React.useCallback(async () => {
    try {
      await logout();
    } finally {
      router.push("/login?reason=idle_timeout");
    }
  }, [logout, router]);

  const { isPrompting, reset } = useIdleTimer({
    timeout: IDLE_TIMEOUT_MS,
    promptTimeout: PROMPT_TIMEOUT_MS,
    onPrompt: () => {
      setSecondsRemaining(PROMPT_TIMEOUT_MS / 1000);
    },
    onIdle: handleIdle,
    onActive: () => {
      setSecondsRemaining(PROMPT_TIMEOUT_MS / 1000);
    },
    disabled: !isLoggedIn,
  });

  // Countdown runterzählen wenn Prompt sichtbar
  React.useEffect(() => {
    if (!isPrompting) return;

    const interval = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, COUNTDOWN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPrompting]);

  // Dialog anzeigen
  if (!isPrompting || !isLoggedIn) return null;

  return (
    <IdleWarningDialog
      secondsRemaining={secondsRemaining}
      onContinue={() => {
        reset();
      }}
      onLogout={handleIdle}
    />
  );
}
