// ============================================================
// Cookie Helpers
// ============================================================

export const AUTH_COOKIE_NAME = "mrk_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

/**
 * Liest einen Cookie-Wert aus dem Request.
 */
export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}

/**
 * Baut einen Set-Cookie-Header.
 */
export function buildAuthCookie(
  token: string,
  maxAge: number = AUTH_COOKIE_MAX_AGE
): string {
  return [
    `${AUTH_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

/**
 * Baut einen Cookie zum Löschen (logout).
 */
export function buildClearAuthCookie(): string {
  return [
    `${AUTH_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Max-Age=0",
  ].join("; ");
}

/**
 * Gibt alle Set-Cookie-Header für eine Response zurück.
 */
export function withAuthCookie(response: Response, token: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", buildAuthCookie(token));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function withClearAuthCookie(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", buildClearAuthCookie());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
