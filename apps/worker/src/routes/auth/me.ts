import type { Env } from "../../types";
import { ok, methodNotAllowed } from "../../lib/response";
import { requireAuth, isAuthError } from "../../middleware/auth";

export async function handleMe(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  return ok({
    user: ctx.user,
    sessionExpiresAt: new Date(ctx.payload.exp * 1000).toISOString(),
  });
}
