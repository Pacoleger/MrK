import type { Env } from "../types";
import { fail } from "../lib/response";
import { requireAuth, isAuthError } from "../middleware/auth";

export async function handleRoom(
  request: Request,
  env: Env,
  roomId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const id = env.ROOMS.idFromName(roomId);
  const stub = env.ROOMS.get(id);

  if (request.headers.get("Upgrade") === "websocket") {
    const user = ctx.user;
    const forwardUrl = new URL(request.url);
    forwardUrl.searchParams.set("userId", user.id);
    forwardUrl.searchParams.set(
      "name",
      `${user.firstName} ${user.lastName}`.trim() || user.email
    );

    return stub.fetch(new Request(forwardUrl.toString(), request));
  }

  return fail("NOT_FOUND", "Nur WebSocket-Verbindungen erlaubt", 400);
}
