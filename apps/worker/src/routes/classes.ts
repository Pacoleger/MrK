import type { Env } from "../types";
import { ok, methodNotAllowed, serverError } from "../lib/response";
import { requireAuth, isAuthError, requireRole } from "../middleware/auth";

// ============================================================
// GET /api/classes — Klassen des Users
// ============================================================

export async function handleClasses(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    if (ctx.user.role === "teacher" || ctx.user.role === "admin") {
      const result = await env.DB.prepare(
        `SELECT DISTINCT c.*, sy.name AS school_year_name
         FROM classes c
         JOIN school_years sy ON sy.id = c.school_year_id
         LEFT JOIN class_subjects cs ON cs.class_id = c.id
         WHERE c.homeroom_teacher_id = ? OR cs.teacher_id = ?
         ORDER BY c.grade_level, c.name`
      )
        .bind(ctx.user.id, ctx.user.id)
        .all();

      return ok({ classes: result.results ?? [] });
    }

    // Schüler: eigene Klassen
    const result = await env.DB.prepare(
      `SELECT c.*, sy.name AS school_year_name
       FROM classes c
       JOIN school_years sy ON sy.id = c.school_year_id
       JOIN class_students cs ON cs.class_id = c.id
       WHERE cs.student_id = ?
       ORDER BY c.grade_level, c.name`
    )
      .bind(ctx.user.id)
      .all();

    return ok({ classes: result.results ?? [] });
  } catch (err) {
    console.error("classes error:", err);
    return serverError();
  }
}

// ============================================================
// GET /api/classes/:id/ranking — Klassen-Rangliste
// ============================================================

export async function handleClassRanking(
  request: Request,
  env: Env,
  classId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    const result = await env.DB.prepare(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        COALESCE(SUM(sr.amount), 0) AS total_stars,
        COUNT(DISTINCT CASE WHEN s.status IN ('submitted', 'graded') THEN s.id END) AS completed
       FROM class_students cs
       JOIN users u ON u.id = cs.student_id
       LEFT JOIN star_rewards sr ON sr.user_id = u.id
       LEFT JOIN submissions s ON s.student_id = u.id
       WHERE cs.class_id = ?
       GROUP BY u.id
       ORDER BY total_stars DESC
       LIMIT 50`
    )
      .bind(classId)
      .all();

    return ok({ ranking: result.results ?? [] });
  } catch (err) {
    console.error("ranking error:", err);
    return serverError();
  }
}

// ============================================================
// GET /api/classes/:id/students — Schüler einer Klasse
// ============================================================

export async function handleClassStudents(
  request: Request,
  env: Env,
  classId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  // Nur Lehrer/Admin
  const roleErr = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleErr) return roleErr;

  try {
    const result = await env.DB.prepare(
      `SELECT u.id, u.first_name, u.last_name, u.email
       FROM class_students cs
       JOIN users u ON u.id = cs.student_id
       WHERE cs.class_id = ?
       ORDER BY u.last_name, u.first_name`
    )
      .bind(classId)
      .all();

    return ok({ students: result.results ?? [] });
  } catch (err) {
    console.error("classStudents error:", err);
    return serverError();
  }
}
// ============================================================
// GET /api/classes/public — Öffentliche Klassen-Liste
// Für die Registrierung (ohne Auth)
// ============================================================

export async function handlePublicClasses(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    const result = await env.DB.prepare(
      `SELECT c.id, c.name, c.grade_level
       FROM classes c
       JOIN school_years sy ON sy.id = c.school_year_id
       WHERE sy.is_active = 1
       ORDER BY c.grade_level, c.name`
    ).all();

    return ok({ classes: result.results ?? [] });
  } catch (err) {
    console.error("publicClasses error:", err);
    return serverError();
  }
}
