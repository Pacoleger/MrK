import { apiGet, apiPost } from "./api";
import type { AuthResponse, LoginCredentials, RegisterData, User } from "./types";

// ============================================================
// Auth API
// ============================================================

export const authApi = {
  /**
   * Registriert einen neuen User.
   */
  register(data: RegisterData): Promise<AuthResponse> {
    return apiPost<AuthResponse>("/api/auth/register", data);
  },

  /**
   * Login mit E-Mail und Passwort.
   */
  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiPost<AuthResponse>("/api/auth/login", credentials);
  },

  /**
   * Liefert den aktuell eingeloggten User.
   */
  async me(): Promise<User> {
    const result = await apiGet<{ user: User; sessionExpiresAt: string }>(
      "/api/auth/me"
    );
    return result.user;
  },

  /**
   * Logout.
   */
  logout(): Promise<{ message: string }> {
    return apiPost<{ message: string }>("/api/auth/logout");
  },
};
