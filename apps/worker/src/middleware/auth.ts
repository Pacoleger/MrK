import type { Env, AuthContext, DbUser, PublicUser, JwtPayload } from "../types";
import { verifyJwt } from "../lib/jwt";
import { getCookie, AUTH_COOKIE_NAME } from "../lib/cookies";
import { toPublicUser } from "../types";
import { fail } from "../lib/response";

/**
 * Extrahiert und verifiziert den Auth-Token aus Cookie oder Authorization-Header.
 */
export async function requireAuth(
  request: Request,
  env: Env
): Promise<AuthContext | Response> {
  if (!env.JWT_SECRET) {
    return fail(
      "SERVER_MISCONFIGURED",
      "JWT secret not configured",
      500
    );
  }

  // Token aus Cookie oder Bearer-Header
  const cookieToken = getCookie(request, AUTH_COOKIE_NAME);
  const authHeader = request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    return fail("UNAUTHORIZED", "Missing authentication", 401);
  }

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) {
    return fail("INVALID_TOKEN", "Invalid or expired token", 401);
  }

  // User in DB nachladen (falls Status geändert)
  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE id = ? AND is_active = 1"
  )
    .bind(payload.sub)
    .first<DbUser>();

  if (!user) {
    return fail("USER_NOT_FOUND", "User not found or inactive", 401);
  }

  return {
    user: toPublicUser(user),
    payload,
  };
}

/**
 * Prüft, ob der Context ein Response-Objekt ist (= Fehler).
 */
export function isAuthError(
  result: AuthContext | Response
): result is Response {
  return result instanceof Response;
}

/**
 * Rollenbasierte Prüfung.
 */
export function requireRole(
  ctx: AuthContext,
  roles: Array<"admin" | "teacher" | "student">
): Response | null {
  if (!roles.includes(ctx.user.role)) {
    return fail(
      "FORBIDDEN",
      `Requires role: ${roles.join(" or ")}`,
      403
    );
  }
  return null;
}
