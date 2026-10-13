// POST /api/admin/users/:id/approve
export async function handleApproveTeacher(
  request: Request,
  env: Env,
  userId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const roleErr = requireRole(ctx as never, ["admin"]);
  if (roleErr) return roleErr;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  const user = await env.DB.prepare(
    "SELECT id, role, is_approved FROM users WHERE id = ?"
  )
    .bind(userId)
    .first<{ id: string; role: string; is_approved: number }>();

  if (!user) return notFound("Benutzer nicht gefunden");
  if (user.role !== "teacher") {
    return fail("NOT_A_TEACHER", "Nur Lehrer können freigeschaltet werden", 400);
  }

  await env.DB.prepare(
    "UPDATE users SET is_approved = 1, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(userId)
    .run();

  // Optional: Notification
  try {
    await createNotification(
      env,
      userId,
      "system",
      "Konto freigeschaltet",
      "Du kannst dich jetzt einloggen.",
      "/login"
    );
  } catch {}

  return ok({ message: "Lehrer freigeschaltet" });
}
