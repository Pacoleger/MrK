import type { Env } from "../../types";
import { ok, methodNotAllowed } from "../../lib/response";
import { withClearAuthCookie } from "../../lib/cookies";
import { requireAuth, isAuthError } from "../../middleware/auth";
import { logActivity } from "../../lib/logger";

export async function handleLogout(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  // Optional authentifiziert – auch ohne gültigen Token 200 zurück
  const ctx = await requireAuth(request, env);
  if (!isAuthError(ctx)) {
    await logActivity(env, {
      userId: ctx.user.id,
      action: "logout",
      request,
    });
  }

  const response = ok({ message: "Logged out" });
  return withClearAuthCookie(response);
}
