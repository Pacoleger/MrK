"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useIdleTimer } from "@/hooks/use-idle-timer";
import { IdleWarningDialog } from "./idle-warning-dialog";

// ============================================================
// Konfiguration
// ============================================================

const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Min
const DEFAULT_PROMPT_TIMEOUT_MS = 60 * 1000;    // 60 Sek

const TEST_IDLE_TIMEOUT_MS = 30 * 1000;         // 30 Sek (Test)
const TEST_PROMPT_TIMEOUT_MS = 15 * 1000;       // 15 Sek (Test)

const COUNTDOWN_INTERVAL_MS = 1000;

// ============================================================
// Idle Manager
// ============================================================

export function IdleManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const testMode = searchParams.get("idle_test") === "1";

  const idleTimeout = testMode ? TEST_IDLE_TIMEOUT_MS : DEFAULT_IDLE_TIMEOUT_MS;
  const promptTimeout = testMode
    ? TEST_PROMPT_TIMEOUT_MS
    : DEFAULT_PROMPT_TIMEOUT_MS;

  const [secondsRemaining, setSecondsRemaining] = React.useState(
    Math.floor(promptTimeout / 1000)
  );

  const isLoggedIn = !!user;

  const handleIdle = React.useCallback(async () => {
    console.log("[IdleManager] 🚪 Logout wegen Inaktivität");
    try {
      await logout();
    } finally {
      router.push("/login?reason=idle_timeout");
    }
  }, [logout, router]);

  const { isPrompting, reset } = useIdleTimer({
    timeout: idleTimeout,
    promptTimeout,
    onPrompt: () => {
      console.log("[IdleManager] ⚠️ Warnung");
      setSecondsRemaining(Math.floor(promptTimeout / 1000));
    },
    onIdle: handleIdle,
    onActive: () => {
      setSecondsRemaining(Math.floor(promptTimeout / 1000));
    },
    disabled: !isLoggedIn,
  });

  React.useEffect(() => {
    if (!isPrompting) return;

    const interval = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, COUNTDOWN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPrompting]);

  if (!isPrompting || !isLoggedIn) return null;

  return (
    <IdleWarningDialog
      secondsRemaining={secondsRemaining}
      onContinue={() => reset()}
      onLogout={handleIdle}
    />
  );
}
