"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
// Helper: Test-Modus direkt aus URL lesen
// ============================================================

function readTestMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("idle_test") === "1";
  } catch {
    return false;
  }
}

// ============================================================
// Idle Manager
// ============================================================

export function IdleManager() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // WICHTIG: Test-Modus SYNCHRON beim ersten Render lesen
  const [testMode] = React.useState<boolean>(() => readTestMode());

  const idleTimeout = testMode ? TEST_IDLE_TIMEOUT_MS : DEFAULT_IDLE_TIMEOUT_MS;
  const promptTimeout = testMode
    ? TEST_PROMPT_TIMEOUT_MS
    : DEFAULT_PROMPT_TIMEOUT_MS;

  const [secondsRemaining, setSecondsRemaining] = React.useState(
    Math.floor(promptTimeout / 1000)
  );

  const isLoggedIn = !!user;

  // Debug
  React.useEffect(() => {
    if (!isLoggedIn) return;
    const mode = testMode ? "🧪 TEST" : "⏱️  PROD";
    console.log(
      `[IdleManager] ${mode}: Idle=${idleTimeout / 1000}s, Prompt=${promptTimeout / 1000}s`
    );
  }, [isLoggedIn, testMode, idleTimeout, promptTimeout]);

  const handleIdle = React.useCallback(async () => {
    console.log("[IdleManager] 🚪 Auto-Logout ausgelöst");
    try {
      await logout();
    } catch (err) {
      console.error("[IdleManager] Logout fehlgeschlagen:", err);
    } finally {
      router.push("/login?reason=idle_timeout");
    }
  }, [logout, router]);

  const { isPrompting, reset } = useIdleTimer({
    timeout: idleTimeout,
    promptTimeout,
    onPrompt: () => {
      console.log("[IdleManager] ⚠️  Warnung anzeigen");
      setSecondsRemaining(Math.floor(promptTimeout / 1000));
    },
    onIdle: handleIdle,
    onActive: () => {
      setSecondsRemaining(Math.floor(promptTimeout / 1000));
    },
    disabled: !isLoggedIn,
  });

  // Countdown tick
  React.useEffect(() => {
    if (!isPrompting) return;

    const interval = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, COUNTDOWN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPrompting]);

  // Auto-Logout bei 0 Sekunden (Sicherheitsnetz)
  React.useEffect(() => {
    if (!isPrompting) return;
    if (secondsRemaining > 0) return;
    // Fallback: Wenn Prompt 0 erreicht, aber noch offen → Logout
    console.log("[IdleManager] ⏰ Countdown 0 → Logout");
    handleIdle();
  }, [isPrompting, secondsRemaining, handleIdle]);

  if (!isPrompting || !isLoggedIn) return null;

  return (
    <IdleWarningDialog
      secondsRemaining={secondsRemaining}
      onContinue={() => {
        console.log("[IdleManager] ✅ Nutzer ist zurück");
        reset();
      }}
      onLogout={handleIdle}
    />
  );
}
