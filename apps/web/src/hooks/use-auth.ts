"use client";

import { useAuthContext } from "@/contexts/auth-context";

/**
 * Zugriff auf Auth-State und -Aktionen.
 */
export function useAuth() {
  return useAuthContext();
}
