import type { Env, DbUser } from "../types";
import { ok, fail, methodNotAllowed, notFound, serverError } from "../lib/response";
import { uuid } from "../lib/crypto";
import { requireAuth, isAuthError, requireRole } from "../middleware/auth";
import { logActivity } from "../lib/logger";

// ============================================================
// Admin: Middleware (nur Admin-Rolle)
// ============================================================

async function requireAdmin(
  request: Request,
  env: Env
): Promise<{ user: { id: string; role: string } } | Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const err = requireRole(ctx as never, ["admin"]);
  if (err) return err;

  return ctx as { user: { id: string; role: string } };
}

// ============================================================
// GET /api/admin/stats — Übersicht
// ============================================================

export async function handleAdminStats(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAdmin(request, env);
  if (ctx instanceof Response) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    const [users, classes, assignments, submissions, quizzes, activity] =
      await Promise.all([
        env.DB.prepare(
          `SELECT role, COUNT(*) AS count FROM users WHERE is_active = 1 GROUP BY role`
        ).all<{ role: string; count: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS count FROM classes").first<{ count: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS count FROM assignments").first<{ count: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS count FROM submissions").first<{ count: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS count FROM quizzes").first<{ count: number }>(),
        env.DB.prepare(
          `SELECT COUNT(*) AS count FROM activity_logs 
           WHERE created_at >= datetime('now', '-7 days')`
        ).first<{ count: number }>(),
      ]);

    const usersByRole: Record<string, number> = {
      admin: 0,
      teacher: 0,
      student: 0,
    };
    for (const row of users.results ?? []) {
      usersByRole[row.role] = row.count;
    }

    return ok({
      users: usersByRole,
      totalUsers: Object.values(usersByRole).reduce((a, b) => a + b, 0),
      classes: classes?.count ?? 0,
      assignments: assignments?.count ?? 0,
      submissions: submissions?.count ?? 0,
      quizzes: quizzes?.count ?? 0,
      weeklyActivity: activity?.count ?? 0,
    });
  } catch (err) {
    console.error("adminStats error:", err);
    return serverError();
  }
}

// ============================================================
// GET /api/admin/users — Benutzer-Liste
// ============================================================

export async function handleAdminUsers(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAdmin(request, env);
  if (ctx instanceof Response) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const search = url.searchParams.get("q");

  try {
    let query = `
      SELECT id, email, first_name, last_name, role, avatar_url, is_active,
             locale, last_login_at, created_at
      FROM users
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (role && ["admin", "teacher", "student"].includes(role)) {
      query += " AND role = ?";
      params.push(role);
    }

    if (search) {
      query += " AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    query += " ORDER BY created_at DESC LIMIT 500";

    const result = await env.DB.prepare(query).bind(...params).all();
    return ok({ users: result.results ?? [] });
  } catch (err) {
    console.error("adminUsers error:", err);
    return serverError();
  }
}

// ============================================================
// PATCH /api/admin/users/:id — Rolle ändern / aktivieren / deaktivieren
// ============================================================

export async function handleAdminUpdateUser(
  request: Request,
  env: Env,
  userId: string
): Promise<Response> {
  const ctx = await requireAdmin(request, env);
  if (ctx instanceof Response) return ctx;

  if (request.method !== "PATCH" && request.method !== "POST") {
    return methodNotAllowed(["PATCH", "POST"]);
  }

  let body: { role?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  // Prüfe User existiert
  const user = await env.DB.prepare("SELECT id, role FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; role: string }>();

  if (!user) return notFound("Benutzer nicht gefunden");

  // Selbst-Deaktivierung verhindern
  if (userId === ctx.user.id && body.isActive === false) {
    return fail("CANNOT_DEACTIVATE_SELF", "Du kannst dich nicht selbst deaktivieren", 400);
  }

  // Selbst-Rollenwechsel verhindern
  if (userId === ctx.user.id && body.role && body.role !== "admin") {
    return fail("CANNOT_DEMOTE_SELF", "Du kannst dich nicht selbst degradieren", 400);
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.role) {
    if (!["admin", "teacher", "student"].includes(body.role)) {
      return fail("INVALID_ROLE", "Ungültige Rolle", 400);
    }
    updates.push("role = ?");
    params.push(body.role);
  }

  if (body.isActive !== undefined) {
    updates.push("is_active = ?");
    params.push(body.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return fail("NO_UPDATES", "Keine Änderungen", 400);
  }

  updates.push("updated_at = datetime('now')");
  params.push(userId);

  try {
    await env.DB.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...params)
      .run();
  } catch (err) {
    console.error("adminUpdateUser error:", err);
    return serverError("Update fehlgeschlagen");
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "admin_action",
    targetType: "user",
    targetId: userId,
    metadata: body as Record<string, unknown>,
    request,
  });

  return ok({ message: "Benutzer aktualisiert" });
}

// ============================================================
// GET /api/admin/classes — Alle Klassen (mit Details)
// ============================================================

export async function handleAdminClasses(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAdmin(request, env);
  if (ctx instanceof Response) return ctx;

  if (request.method === "GET") {
    try {
      const result = await env.DB.prepare(
        `SELECT c.*, sy.name AS school_year_name,
                u.first_name AS teacher_first, u.last_name AS teacher_last,
                (SELECT COUNT(*) FROM class_students WHERE class_id = c.id) AS student_count
         FROM classes c
         LEFT JOIN school_years sy ON sy.id = c.school_year_id
         LEFT JOIN users u ON u.id = c.homeroom_teacher_id
         ORDER BY c.grade_level, c.name`
      ).all();
      return ok({ classes: result.results ?? [] });
    } catch (err) {
      console.error("adminClasses error:", err);
      return serverError();
    }
  }

  if (request.method === "POST") {
    return createClass(request, env, ctx);
  }

  return methodNotAllowed(["GET", "POST"]);
}

async function createClass(
  request: Request,
  env: Env,
  ctx: { user: { id: string } }
): Promise<Response> {
  let body: {
    name?: string;
    gradeLevel?: number;
    schoolYearId?: string;
    homeroomTeacherId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  if (!body.name?.trim()) return fail("NAME_REQUIRED", "Name ist erforderlich", 400);
  if (!body.gradeLevel || body.gradeLevel < 5 || body.gradeLevel > 13) {
    return fail("INVALID_GRADE", "Klassenstufe muss zwischen 5 und 13 liegen", 400);
  }
  if (!body.schoolYearId) {
    return fail("YEAR_REQUIRED", "Schuljahr ist erforderlich", 400);
  }

  const id = uuid();
  try {
    await env.DB.prepare(
      `INSERT INTO classes (id, name, grade_level, school_year_id, homeroom_teacher_id)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name.trim(),
        body.gradeLevel,
        body.schoolYearId,
        body.homeroomTeacherId || null
      )
      .run();
  } catch (err) {
    console.error("createClass error:", err);
    return serverError("Klasse konnte nicht erstellt werden");
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "admin_action",
    targetType: "class",
    targetId: id,
    metadata: { action: "create", name: body.name },
    request,
  });

  return ok({ id, message: "Klasse erstellt" });
}

// ============================================================
// DELETE /api/admin/classes/:id — Klasse löschen
// ============================================================

export async function handleAdminDeleteClass(
  request: Request,
  env: Env,
  classId: string
): Promise<Response> {
  const ctx = await requireAdmin(request, env);
  if (ctx instanceof Response) return ctx;

  if (request.method !== "DELETE") return methodNotAllowed(["DELETE"]);

  const cls = await env.DB.prepare("SELECT id, name FROM classes WHERE id = ?")
    .bind(classId)
    .first<{ id: string; name: string }>();

  if (!cls) return notFound("Klasse nicht gefunden");

  try {
    await env.DB.prepare("DELETE FROM classes WHERE id = ?").bind(classId).run();
  } catch (err) {
    console.error("deleteClass error:", err);
    return serverError("Klasse konnte nicht gelöscht werden");
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "admin_action",
    targetType: "class",
    targetId: classId,
    metadata: { action: "delete", name: cls.name },
    request,
  });

  return ok({ message: "Klasse gelöscht" });
}

// ============================================================
// GET /api/admin/school-years — Schuljahre
// ============================================================

export async function handleAdminSchoolYears(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAdmin(request, env);
  if (ctx instanceof Response) return ctx;

  if (request.method === "GET") {
    try {
      const result = await env.DB.prepare(
        `SELECT sy.*, 
                (SELECT COUNT(*) FROM classes WHERE school_year_id = sy.id) AS class_count
         FROM school_years sy
         ORDER BY sy.start_date DESC`
      ).all();
      return ok({ schoolYears: result.results ?? [] });
    } catch (err) {
      console.error("adminSchoolYears error:", err);
      return serverError();
    }
  }

  if (request.method === "POST") {
    return createSchoolYear(request, env, ctx);
  }

  return methodNotAllowed(["GET", "POST"]);
}

async function createSchoolYear(
  request: Request,
  env: Env,
  ctx: { user: { id: string } }
): Promise<Response> {
  let body: {
    name?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  if (!body.name?.trim()) return fail("NAME_REQUIRED", "Name ist erforderlich", 400);
  if (!body.startDate) return fail("START_REQUIRED", "Startdatum ist erforderlich", 400);
  if (!body.endDate) return fail("END_REQUIRED", "Enddatum ist erforderlich", 400);

  const id = uuid();
  try {
    // Falls isActive=true → alle anderen deaktivieren
    if (body.isActive) {
      await env.DB.prepare("UPDATE school_years SET is_active = 0").run();
    }

    await env.DB.prepare(
      `INSERT INTO school_years (id, name, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name.trim(),
        body.startDate,
        body.endDate,
        body.isActive ? 1 : 0
      )
      .run();
  } catch (err) {
    console.error("createSchoolYear error:", err);
    return serverError("Schuljahr konnte nicht erstellt werden");
  }

  return ok({ id, message: "Schuljahr erstellt" });
}
