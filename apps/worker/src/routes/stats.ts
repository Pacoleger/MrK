import type { Env } from "../types";
import { ok, methodNotAllowed, serverError } from "../lib/response";
import { requireAuth, isAuthError } from "../middleware/auth";
import { getTotalStars, calculateLevel } from "../lib/gamification";

// ============================================================
// GET /api/stats/me — Persönliche Statistik
// ============================================================

export async function handleMyStats(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    const userId = ctx.user.id;

    // Submission-Stats
    const submissionStats = await env.DB.prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) AS not_started,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) AS graded
       FROM submissions WHERE student_id = ?`
    )
      .bind(userId)
      .first<{
        total: number;
        not_started: number;
        in_progress: number;
        submitted: number;
        graded: number;
      }>();

    // Punkte
    const grades = await env.DB.prepare(
      `SELECT
        COALESCE(SUM(g.points), 0) AS total_points,
        COALESCE(SUM(g.max_points), 0) AS total_max
       FROM grades g
       JOIN submissions s ON s.id = g.submission_id
       WHERE s.student_id = ?`
    )
      .bind(userId)
      .first<{ total_points: number; total_max: number }>();

    // Sterne + Level
    const totalStars = await getTotalStars(env, userId);
    const level = calculateLevel(totalStars);

    // Badges
    const badges = await env.DB.prepare(
      `SELECT b.id, b.code, b.name_de, b.name_en, b.name_fr, b.icon, b.color, ub.awarded_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY ub.awarded_at DESC`
    )
      .bind(userId)
      .all();

    // Erledigt diese Woche
    const weekly = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM submissions
       WHERE student_id = ?
         AND status IN ('submitted', 'graded')
         AND submitted_at >= datetime('now', '-7 days')`
    )
      .bind(userId)
      .first<{ count: number }>();

    return ok({
      submissions: submissionStats ?? {
        total: 0,
        not_started: 0,
        in_progress: 0,
        submitted: 0,
        graded: 0,
      },
      points: {
        earned: grades?.total_points ?? 0,
        max: grades?.total_max ?? 0,
      },
      stars: totalStars,
      level,
      badges: badges.results ?? [],
      weekly: {
        completed: weekly?.count ?? 0,
      },
    });
  } catch (err) {
    console.error("stats error:", err);
    return serverError();
  }
}
