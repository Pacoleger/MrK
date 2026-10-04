import type { Env } from "../types";
import { ok, fail, methodNotAllowed, serverError } from "../lib/response";
import { requireAuth, isAuthError } from "../middleware/auth";

// ============================================================
// GET /api/notifications — Liste der Benachrichtigungen
// ============================================================

export async function handleNotifications(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);

  try {
    const query = `
      SELECT id, type, title, message, link_url, is_read, created_at
      FROM notifications
      WHERE user_id = ? ${unreadOnly ? "AND is_read = 0" : ""}
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const result = await env.DB.prepare(query)
      .bind(ctx.user.id, limit)
      .all();

    const unreadCount = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0"
    )
      .bind(ctx.user.id)
      .first<{ count: number }>();

    return ok({
      notifications: result.results ?? [],
      unreadCount: unreadCount?.count ?? 0,
    });
  } catch (err) {
    console.error("notifications error:", err);
    return serverError();
  }
}

// ============================================================
// POST /api/notifications/:id/read — als gelesen markieren
// ============================================================

export async function handleMarkRead(
  request: Request,
  env: Env,
  notificationId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  await env.DB.prepare(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
  )
    .bind(notificationId, ctx.user.id)
    .run();

  return ok({ message: "Marked as read" });
}

// ============================================================
// POST /api/notifications/read-all — alle als gelesen
// ============================================================

export async function handleMarkAllRead(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  await env.DB.prepare(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ?"
  )
    .bind(ctx.user.id)
    .run();

  return ok({ message: "All marked as read" });
}
