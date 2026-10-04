import type { Env, DbAssignment, DbClassStudent } from "../types";
import { ok, fail, methodNotAllowed, notFound, serverError } from "../lib/response";
import { uuid } from "../lib/crypto";
import { requireAuth, isAuthError, requireRole } from "../middleware/auth";
import { logActivity } from "../lib/logger";
import { createNotification } from "../lib/gamification";
import { validateName } from "../lib/validation";

// ============================================================
// GET /api/assignments — Liste (rollenbasiert)
// POST /api/assignments — Erstellen (nur Lehrer/Admin)
// ============================================================

export async function handleAssignments(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method === "GET") return listAssignments(request, env, ctx);
  if (request.method === "POST") return createAssignment(request, env, ctx);

  return methodNotAllowed(["GET", "POST"]);
}

// ------------------------------------------------------------
// LIST
// ------------------------------------------------------------
async function listAssignments(
  request: Request,
  env: Env,
  ctx: { user: { id: string; role: string } }
): Promise<Response> {
  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");
  const subjectId = url.searchParams.get("subjectId");

  try {
    if (ctx.user.role === "teacher" || ctx.user.role === "admin") {
      // Lehrer sieht eigene Aufgaben
      const query = `
        SELECT a.*, s.name_de AS subject_name, c.name AS class_name
        FROM assignments a
        JOIN subjects s ON s.id = a.subject_id
        JOIN classes c ON c.id = a.class_id
        WHERE a.teacher_id = ?
          ${classId ? "AND a.class_id = ?" : ""}
          ${subjectId ? "AND a.subject_id = ?" : ""}
        ORDER BY a.created_at DESC
      `;
      const params: string[] = [ctx.user.id];
      if (classId) params.push(classId);
      if (subjectId) params.push(subjectId);

      const result = await env.DB.prepare(query).bind(...params).all();
      return ok({ assignments: result.results ?? [] });
    }

    // Schüler sieht Aufgaben seiner Klassen
    const query = `
      SELECT a.*, s.name_de AS subject_name, c.name AS class_name,
             sub.status AS submission_status,
             sub.submitted_at,
             sub.id AS submission_id
      FROM assignments a
      JOIN subjects s ON s.id = a.subject_id
      JOIN classes c ON c.id = a.class_id
      JOIN class_students cs ON cs.class_id = a.class_id AND cs.student_id = ?
      LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
      WHERE a.is_published = 1
      ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC
    `;
    const result = await env.DB.prepare(query)
      .bind(ctx.user.id, ctx.user.id)
      .all();

    return ok({ assignments: result.results ?? [] });
  } catch (err) {
    console.error("listAssignments error:", err);
    return serverError();
  }
}

// ------------------------------------------------------------
// CREATE (Lehrer/Admin)
// ------------------------------------------------------------
async function createAssignment(
  request: Request,
  env: Env,
  ctx: { user: { id: string; role: string } }
): Promise<Response> {
  const roleError = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleError) return roleError;

  let body: {
    classId?: string;
    subjectId?: string;
    title?: string;
    description?: string;
    type?: string;
    maxPoints?: number;
    dueDate?: string;
  };

  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Invalid JSON", 400);
  }

  console.log("[createAssignment] body:", JSON.stringify(body));

  if (!body.classId) return fail("CLASS_REQUIRED", "classId is required", 400);
  if (!body.subjectId) return fail("SUBJECT_REQUIRED", "subjectId is required", 400);

  const titleCheck = validateName(body.title, "title");
  if (!titleCheck.valid) return fail(titleCheck.error!, "Title required", 400);

  const type = body.type ?? "homework";
  const validTypes = ["homework", "exercise", "test", "quiz", "project"];
  if (!validTypes.includes(type)) {
    return fail("INVALID_TYPE", `type must be one of: ${validTypes.join(", ")}`, 400);
  }

  const maxPoints = Math.min(Math.max(body.maxPoints ?? 100, 1), 1000);

  // due_date robust normalisieren: leerer String → null
  let dueDate: string | null = null;
  if (body.dueDate && typeof body.dueDate === "string" && body.dueDate.trim() !== "") {
    try {
      dueDate = new Date(body.dueDate).toISOString();
    } catch {
      dueDate = null;
    }
  }

  // Prüfen, ob Klasse existiert
  const classExists = await env.DB.prepare(
    "SELECT id FROM classes WHERE id = ?"
  ).bind(body.classId).first<{ id: string }>();

  if (!classExists) {
    return fail("CLASS_NOT_FOUND", `Klasse ${body.classId} nicht gefunden`, 400);
  }

  // Prüfen, ob Lehrer der Klasse zugewiesen ist
  const teacherAssigned = await env.DB.prepare(
    `SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ? AND teacher_id = ?`
  ).bind(body.classId, body.subjectId, ctx.user.id).first<{ id: string }>();

  // Nur warnen, wenn nicht zugewiesen – nicht blockieren
  if (!teacherAssigned) {
    console.warn(`[createAssignment] Teacher ${ctx.user.id} not assigned to class ${body.classId} / subject ${body.subjectId}`);
  }

  const id = uuid();
  try {
    await env.DB.prepare(
      `INSERT INTO assignments
        (id, class_id, subject_id, teacher_id, title, description, type, max_points, due_date, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(
        id,
        body.classId,
        body.subjectId,
        ctx.user.id,
        body.title!.trim(),
        body.description?.trim() || null,
        type,
        maxPoints,
        dueDate
      )
      .run();
  } catch (err) {
    console.error("createAssignment INSERT error:", err);
    return serverError(
      `Failed to create assignment: ${err instanceof Error ? err.message : "Unknown"}`
    );
  }

  // Notifications an alle Schüler der Klasse
  try {
    const students = await env.DB.prepare(
      "SELECT student_id FROM class_students WHERE class_id = ?"
    )
      .bind(body.classId)
      .all<{ student_id: string }>();

    for (const s of students.results ?? []) {
      await createNotification(
        env,
        s.student_id,
        "new_assignment",
        "Neue Aufgabe",
        body.title!.trim(),
        `/dashboard/aufgaben/${id}`
      );
    }
  } catch (err) {
    console.error("Notification error:", err);
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "create_assignment",
    targetType: "assignment",
    targetId: id,
    request,
  });

  return ok({ id, message: "Assignment created" });
}
// ============================================================
// GET /api/assignments/:id — Detail
// ============================================================

export async function handleAssignmentDetail(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const assignment = await env.DB.prepare(
    `SELECT a.*, s.name_de AS subject_name, c.name AS class_name,
            u.first_name AS teacher_first, u.last_name AS teacher_last
     FROM assignments a
     JOIN subjects s ON s.id = a.subject_id
     JOIN classes c ON c.id = a.class_id
     JOIN users u ON u.id = a.teacher_id
     WHERE a.id = ?`
  )
    .bind(id)
    .first<DbAssignment & {
      subject_name: string;
      class_name: string;
      teacher_first: string;
      teacher_last: string;
    }>();

  if (!assignment) return notFound("Assignment not found");

  // Zugriff prüfen
  if (ctx.user.role === "student") {
    const enrolled = await env.DB.prepare(
      "SELECT id FROM class_students WHERE class_id = ? AND student_id = ?"
    )
      .bind(assignment.class_id, ctx.user.id)
      .first<{ id: string }>();

    if (!enrolled) return fail("FORBIDDEN", "Not enrolled in this class", 403);

    // Submission laden oder anlegen
    let submission = await env.DB.prepare(
      "SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?"
    )
      .bind(id, ctx.user.id)
      .first();

    if (!submission) {
      const subId = uuid();
      await env.DB.prepare(
        `INSERT INTO submissions (id, assignment_id, student_id, status)
         VALUES (?, ?, ?, 'not_started')`
      )
        .bind(subId, id, ctx.user.id)
        .run();

      submission = {
        id: subId,
        status: "not_started",
        time_spent_sec: 0,
        view_count: 0,
      };
    }

    return ok({ assignment, submission });
  }

  // Lehrer / Admin
  return ok({ assignment });
}
