// ============================================================
// API Client
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://mrk-api.pacokamegne.workers.dev";

// ============================================================
// Error
// ============================================================

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "ApiError";
  }
}

// ============================================================
// Types
// ============================================================

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  retries?: number;
  skipAuthRedirect?: boolean;
}

// ============================================================
// Auth-Redirect-Handler
// ============================================================

let lastRedirectTime = 0;

function redirectToLogin() {
  if (typeof window === "undefined") return;

  // Nur auf Dashboard-Seiten redirecten
  if (!window.location.pathname.startsWith("/dashboard")) return;

  // Throttle: Max 1x pro 5 Sekunden
  const now = Date.now();
  if (now - lastRedirectTime < 5000) return;
  lastRedirectTime = now;

  // WICHTIG: Nur wenn wir sicher sind, dass Cookie fehlt
  // Prüfen ob nach Login schon ein Redirect-Zähler existiert
  const redirectCount = parseInt(
    sessionStorage.getItem("mrk_redirect_count") || "0",
    10
  );

  if (redirectCount >= 2) {
    // Zu viele Redirects → Login-Seite ohne redirect-Param
    console.warn("[Auth] Redirect-Loop erkannt – Reset");
    sessionStorage.removeItem("mrk_redirect_count");
    window.location.href = "/login";
    return;
  }

  sessionStorage.setItem("mrk_redirect_count", String(redirectCount + 1));

  const currentPath = window.location.pathname + window.location.search;
  const redirect = encodeURIComponent(currentPath);
  window.location.href = `/login?redirect=${redirect}&reason=session_expired`;
}

// ============================================================
// Fetch mit Retry + Auth-Handling
// ============================================================

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    headers,
    retries = 2,
    skipAuthRedirect = false,
    ...rest
  } = options;

  const url = `${API_URL}${path}`;

  const requestInit: RequestInit = {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, requestInit);

      // Server Error → Retry
      if (response.status >= 500 && attempt < retries) {
        await sleep(300 * Math.pow(2, attempt));
        continue;
      }

      // JSON parsen
      let json: ApiResponse<T>;
      try {
        json = (await response.json()) as ApiResponse<T>;
      } catch {
        throw new ApiError(
          "INVALID_RESPONSE",
          `Ungültige Server-Antwort (HTTP ${response.status})`,
          response.status
        );
      }

      // Fehler-Antwort
      if (!json.success) {
        // 401 → Session abgelaufen
        if (response.status === 401 && !skipAuthRedirect) {
          redirectToLogin();
        }

        throw new ApiError(
          json.error.code,
          json.error.message,
          response.status
        );
      }

      return json.data;
    } catch (err) {
      lastError = err as Error;

      // Retry nur bei Netzwerkfehlern (nicht bei ApiError)
      if (err instanceof ApiError) throw err;

      if (attempt < retries) {
        await sleep(300 * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError ?? new Error("Unbekannter Fehler");
}

// ============================================================
// Helpers
// ============================================================

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "POST", body });
}

export function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "PUT", body });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "PATCH", body });
}

export function apiDelete<T>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "DELETE" });
}
