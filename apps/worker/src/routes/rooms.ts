// apps/worker/src/routes/rooms.ts
import type { Env } from "../types";
import { ok, fail, requireAuth, isAuthError } from "../middleware/auth"; // Passe Imports ggf. an

export async function handleRoom(request: Request, env: Env, roomId: string): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const url = new URL(request.url);
  
  // Wir brauchen die ID des Durable Objects (hier einfach der Raumname)
  const id = env.ROOMS.idFromName(roomId);
  const stub = env.ROOMS.get(id);

  // Wenn es eine WebSocket-Anfrage ist, leiten wir sie weiter
  if (request.headers.get("Upgrade") === "websocket") {
    const user = ctx.user;
    const forwardUrl = new URL(request.url);
    forwardUrl.searchParams.set("userId", user.id);
    forwardUrl.searchParams.set("name", (user as any).firstName || user.email || "Unbekannt");
    
    return stub.fetch(new Request(forwardUrl.toString(), request));
  }

  return fail("NOT_FOUND", "Route nicht gefunden", 404);
}
