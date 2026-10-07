import { apiGet, apiPost } from "./api";
import { resetRedirectCounter } from "./api";
import type { AuthResponse, LoginCredentials, RegisterData, User } from "./types";

// ============================================================
// Auth API
// ============================================================

export const authApi = {
  /**
   * Registriert einen neuen User.
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const result = await apiPost<AuthResponse>("/api/auth/register", data, {
      skipAuthRedirect: true,
    });
    resetRedirectCounter();
    return result;
  },

  /**
   * Login mit E-Mail und Passwort.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const result = await apiPost<AuthResponse>("/api/auth/login", credentials, {
      skipAuthRedirect: true,
    });
    resetRedirectCounter();
    return result;
  },

  /**
   * Liefert den aktuell eingeloggten User.
   * skipAuthRedirect: true → bei 401 wird NICHT redirectet,
   * sondern die Exception wird an den Aufrufer weitergegeben.
   */
  async me(): Promise<User> {
    const result = await apiGet<{ user: User; sessionExpiresAt: string }>(
      "/api/auth/me",
      { skipAuthRedirect: true }
    );
    return result.user;
  },

  /**
   * Logout.
   */
  async logout(): Promise<{ message: string }> {
    const result = await apiPost<{ message: string }>("/api/auth/logout", undefined, {
      skipAuthRedirect: true,
    });
    resetRedirectCounter();
    return result;
  },
};
