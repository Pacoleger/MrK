"use client";

import * as React from "react";
import { statsApi, type StudentStats } from "@/lib/stats-api";
import { ApiError } from "@/lib/api";

const POLL_INTERVAL_MS = 30_000;

export function useStats() {
  const [stats, setStats] = React.useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const data = await statsApi.me();
      setStats(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "UNAUTHORIZED") {
        setError("Nicht angemeldet");
      } else {
        setError(err instanceof Error ? err.message : "Fehler beim Laden");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { stats, isLoading, error, refresh: load };
}
