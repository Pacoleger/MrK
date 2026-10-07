"use client";

import * as React from "react";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import type { LoginCredentials, RegisterData, User } from "@/lib/types";

// ============================================================
// Auth Context
// ============================================================

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

// ============================================================
// Retry-Helper für iOS-Cookie-Timing
// ============================================================

async function fetchMeWithRetry(
  maxAttempts = 3
): Promise<User> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const user = await authApi.me();
      if (attempt > 0) {
        console.log(`[Auth] Erfolgreich nach ${attempt} Retry(s)`);
      }
      return user;
    } catch (err) {
      lastError = err;

      // Nur bei 401 retryen (Cookie-Timing-Problem)
      if (err instanceof ApiError && err.code === "UNAUTHORIZED") {
        // Exponentielles Backoff: 300ms, 600ms, 1200ms
        const delay = 300 * Math.pow(2, attempt);
        console.log(`[Auth] 401 - Retry in ${delay}ms (Versuch ${attempt + 1}/${maxAttempts})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Andere Fehler sofort werfen
      throw err;
    }
  }

  throw lastError;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  /**
   * Session beim App-Start laden (mit Retry).
   */
  const refresh = React.useCallback(async () => {
    try {
      const u = await fetchMeWithRetry();
      setUser(u);
    } catch (err) {
      // Nach allen Retries: Nutzer ist nicht eingeloggt
      if (err instanceof ApiError && err.code === "UNAUTHORIZED") {
        setUser(null);
      } else {
        console.error("Auth refresh error:", err);
        setUser(null);
      }
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await fetchMeWithRetry();
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    const result = await authApi.login(credentials);
    setUser(result.user);

    // 🎯 Wichtig für iOS: Nach Login kurz warten, dann `me` prüfen
    // (damit ist das Cookie sicher im Browser)
    await new Promise((r) => setTimeout(r, 200));

    return result.user;
  }, []);

  const register = React.useCallback(async (data: RegisterData) => {
    const result = await authApi.register(data);
    setUser(result.user);
    await new Promise((r) => setTimeout(r, 200));
    return result.user;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      refresh,
    }),
    [user, isLoading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
