import type { Env, DbSubmission } from "../types";
import { ok, fail, methodNotAllowed, notFound, serverError } from "../lib/response";
import { uuid } from "../lib/crypto";
import { requireAuth, isAuthError, requireRole } from "../middleware/auth";
import { logActivity } from "../lib/logger";
import { awardStars, createNotification } from "../lib/gamification";

// ============================================================
// POST /api/submissions/start/:assignmentId — Aufgabe starten
// ============================================================

export async function handleStartSubmission(
  request: Request,
  env: Env,
  assignmentId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  const sub = await env.DB.prepare(
    "SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?"
  )
    .bind(assignmentId, ctx.user.id)
    .first<DbSubmission>();

  if (!sub) return notFound("Submission not found");

  if (sub.status !== "not_started") {
    return ok({ submission: sub, message: "Already started" });
  }

  await env.DB.prepare(
    `UPDATE submissions
     SET status = 'in_progress', started_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(sub.id)
    .run();

  await logActivity(env, {
    userId: ctx.user.id,
    action: "start_assignment",
    targetType: "assignment",
    targetId: assignmentId,
    request,
  });

  const updated = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?")
    .bind(sub.id)
    .first<DbSubmission>();

  return ok({ submission: updated });
}

// ============================================================
// POST /api/submissions/heartbeat/:submissionId — Timer-Tracking
// ============================================================

export async function handleHeartbeat(
  request: Request,
  env: Env,
  submissionId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  let body: { seconds?: number; viewCount?: number } = {};
  try {
    body = await request.json();
  } catch {
    // Ignore
  }

  const seconds = Math.min(Math.max(body.seconds ?? 30, 1), 300);
  const viewCount = Math.max(body.viewCount ?? 0, 0);

  await env.DB.prepare(
    `UPDATE submissions
     SET time_spent_sec = time_spent_sec + ?,
         view_count = view_count + ?,
         updated_at = datetime('now')
     WHERE id = ? AND student_id = ?`
  )
    .bind(seconds, viewCount, submissionId, ctx.user.id)
    .run();

  return ok({ message: "ok" });
}

// ============================================================
// POST /api/submissions/submit/:submissionId — Abgeben
// ============================================================

export async function handleSubmit(
  request: Request,
  env: Env,
  submissionId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  let body: { content?: string; timeSpentSec?: number } = {};
  try {
    body = await request.json();
  } catch {
    // Ignore
  }

  const sub = await env.DB.prepare(
    "SELECT * FROM submissions WHERE id = ? AND student_id = ?"
  )
    .bind(submissionId, ctx.user.id)
    .first<DbSubmission>();

  if (!sub) return notFound("Submission not found");

  if (sub.status === "submitted" || sub.status === "graded") {
    return fail("ALREADY_SUBMITTED", "Already submitted", 409);
  }

  const content = body.content?.trim() ?? null;
  const timeSpent = Math.max(body.timeSpentSec ?? sub.time_spent_sec, 0);

  await env.DB.prepare(
    `UPDATE submissions
     SET status = 'submitted',
         content = ?,
         submitted_at = datetime('now'),
         time_spent_sec = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(content, timeSpent, submissionId)
    .run();

  // ----- Sterne vergeben -----
  await awardStars(
    env,
    ctx.user.id,
    1,
    "assignment_completed",
    submissionId,
    "Aufgabe abgegeben"
  );

  // Pünktlich?
  const assignment = await env.DB.prepare(
    "SELECT due_date FROM assignments WHERE id = ?"
  )
    .bind(sub.assignment_id)
    .first<{ due_date: string | null }>();

  if (assignment?.due_date) {
    const due = new Date(assignment.due_date).getTime();
    const now = Date.now();
    if (now <= due) {
      await awardStars(
        env,
        ctx.user.id,
        2,
        "on_time_submission",
        submissionId,
        "Pünktlich abgegeben"
      );
    }
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "submit_assignment",
    targetType: "submission",
    targetId: submissionId,
    request,
  });

  return ok({ message: "Submitted", submissionId });
}

// ============================================================
// POST /api/submissions/grade/:submissionId — Bewerten (Lehrer)
// ============================================================

export async function handleGrade(
  request: Request,
  env: Env,
  submissionId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const roleErr = requireRole(ctx, ["teacher", "admin"]);
  if (roleErr) return roleErr;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  let body: {
    points?: number;
    maxPoints?: number;
    feedback?: string;
    starsAwarded?: number;
  };

  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Invalid JSON", 400);
  }

  const sub = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?")
    .bind(submissionId)
    .first<DbSubmission>();

  if (!sub) return notFound("Submission not found");

  const points = Math.max(0, body.points ?? 0);
  const maxPoints = Math.max(1, body.maxPoints ?? 100);
  const starsAwarded = Math.max(0, body.starsAwarded ?? 0);

  // Upsert grade
  const existing = await env.DB.prepare(
    "SELECT id FROM grades WHERE submission_id = ?"
  )
    .bind(submissionId)
    .first<{ id: string }>();

  if (existing) {
    await env.DB.prepare(
      `UPDATE grades SET points = ?, max_points = ?, feedback = ?, stars_awarded = ?, grader_id = ?, graded_at = datetime('now')
       WHERE id = ?`
    )
      .bind(points, maxPoints, body.feedback ?? null, starsAwarded, ctx.user.id, existing.id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO grades (id, submission_id, grader_id, points, max_points, feedback, stars_awarded)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(uuid(), submissionId, ctx.user.id, points, maxPoints, body.feedback ?? null, starsAwarded)
      .run();
  }

  await env.DB.prepare(
    "UPDATE submissions SET status = 'graded', updated_at = datetime('now') WHERE id = ?"
  )
    .bind(submissionId)
    .run();

  // Sterne vergeben
  if (starsAwarded > 0) {
    await awardStars(
      env,
      sub.student_id,
      starsAwarded,
      "excellent_solution",
      submissionId,
      "Bewertung erhalten"
    );
  }

  // Notification an Schüler
  await createNotification(
    env,
    sub.student_id,
    "grade_published",
    "Bewertung erhalten",
    `Deine Abgabe wurde bewertet: ${points}/${maxPoints} Punkte`,
    `/dashboard/aufgaben`
  );

  await logActivity(env, {
    userId: ctx.user.id,
    action: "grade_submission",
    targetType: "submission",
    targetId: submissionId,
    request,
  });

  return ok({ message: "Graded" });
}
