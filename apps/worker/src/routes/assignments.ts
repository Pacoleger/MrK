import type { Env, DbAssignment } from "../types";
import {
  ok,
  fail,
  methodNotAllowed,
  notFound,
  serverError,
} from "../lib/response";
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
  // 1. Nur Lehrer/Admin
  const roleError = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleError) return roleError;

  // 2. Body lesen
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
    return fail("INVALID_JSON", "Ungültiger Request-Body", 400);
  }

  // 3. Debug: Was kommt an?
  console.log("[createAssignment] ============================================");
  console.log("[createAssignment] payload:", JSON.stringify(body, null, 2));
  console.log("[createAssignment] teacherId:", ctx.user.id);
  console.log("[createAssignment] ============================================");

  // 4. Validierung
  if (!body.classId || typeof body.classId !== "string" || !body.classId.trim()) {
    return fail("CLASS_REQUIRED", "classId ist erforderlich", 400);
  }
  if (!body.subjectId || typeof body.subjectId !== "string" || !body.subjectId.trim()) {
    return fail("SUBJECT_REQUIRED", "subjectId ist erforderlich", 400);
  }

  const titleCheck = validateName(body.title, "title");
  if (!titleCheck.valid) {
    return fail(titleCheck.error!, "Titel ist erforderlich", 400);
  }

  const type = body.type ?? "homework";
  const validTypes = ["homework", "exercise", "test", "quiz", "project"];
  if (!validTypes.includes(type)) {
    return fail(
      "INVALID_TYPE",
      `type muss einer sein von: ${validTypes.join(", ")}`,
      400
    );
  }

  const maxPoints = Math.min(Math.max(Number(body.maxPoints) || 100, 1), 1000);

  // 5. dueDate robust normalisieren
  let dueDate: string | null = null;
  if (
    body.dueDate &&
    typeof body.dueDate === "string" &&
    body.dueDate.trim() !== ""
  ) {
    try {
      const parsed = new Date(body.dueDate);
      if (!isNaN(parsed.getTime())) {
        dueDate = parsed.toISOString();
      }
    } catch {
      dueDate = null;
    }
  }

  console.log("[createAssignment] normalized values:", {
    classId: body.classId,
    subjectId: body.subjectId,
    title: body.title!.trim(),
    type,
    maxPoints,
    dueDate,
  });

  // 6. Klasse prüfen
  try {
    const classExists = await env.DB.prepare(
      "SELECT id, name FROM classes WHERE id = ?"
    )
      .bind(body.classId.trim())
      .first<{ id: string; name: string }>();

    if (!classExists) {
      // Zeige alle existierenden Klassen im Log
      const allClasses = await env.DB.prepare(
        "SELECT id, name FROM classes"
      ).all<{ id: string; name: string }>();

      console.error(
        "[createAssignment] Klasse nicht gefunden:",
        body.classId,
        "Verfügbare Klassen:",
        JSON.stringify(allClasses.results)
      );

      return fail(
        "CLASS_NOT_FOUND",
        `Klasse "${body.classId}" existiert nicht. Verfügbare: ${
          allClasses.results?.map((c) => c.id).join(", ") ?? "keine"
        }`,
        400
      );
    }
  } catch (err) {
    console.error("[createAssignment] DB class check failed:", err);
    return serverError("Datenbankfehler bei der Klassenprüfung");
  }

  // 7. Fach prüfen
  try {
    const subjectExists = await env.DB.prepare(
      "SELECT id FROM subjects WHERE id = ?"
    )
      .bind(body.subjectId.trim())
      .first<{ id: string }>();

    if (!subjectExists) {
      return fail(
        "SUBJECT_NOT_FOUND",
        `Fach "${body.subjectId}" existiert nicht`,
        400
      );
    }
  } catch (err) {
    console.error("[createAssignment] DB subject check failed:", err);
    return serverError("Datenbankfehler bei der Fachprüfung");
  }

  // 8. INSERT
  const id = uuid();

  try {
    console.log("[createAssignment] INSERT mit:", {
      id,
      classId: body.classId.trim(),
      subjectId: body.subjectId.trim(),
      teacherId: ctx.user.id,
      title: body.title!.trim(),
    });

    await env.DB.prepare(
      `INSERT INTO assignments
        (id, class_id, subject_id, teacher_id, title, description, type, max_points, due_date, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(
        id,
        body.classId.trim(),
        body.subjectId.trim(),
        ctx.user.id,
        body.title!.trim(),
        body.description?.trim() || null,
        type,
        maxPoints,
        dueDate
      )
      .run();

    console.log("[createAssignment] INSERT erfolgreich:", id);
  } catch (err) {
    console.error("[createAssignment] INSERT failed:", err);
    return serverError(
      `DB Fehler: ${err instanceof Error ? err.message : "Unbekannt"}`
    );
  }

  // 9. Notifications (best-effort, blockiert nicht)
  try {
    const students = await env.DB.prepare(
      "SELECT student_id FROM class_students WHERE class_id = ?"
    )
      .bind(body.classId.trim())
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
    console.error("[createAssignment] notification failed:", err);
    // nicht fatal
  }

  // 10. Activity Log (best-effort)
  try {
    await logActivity(env, {
      userId: ctx.user.id,
      action: "create_assignment",
      targetType: "assignment",
      targetId: id,
      request,
    });
  } catch (err) {
    console.error("[createAssignment] logActivity failed:", err);
    // nicht fatal
  }

  return ok({ id, message: "Aufgabe erstellt" });
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
    .first<
      DbAssignment & {
        subject_name: string;
        class_name: string;
        teacher_first: string;
        teacher_last: string;
      }
    >();

  if (!assignment) return notFound("Aufgabe nicht gefunden");

  // Zugriff prüfen
  if (ctx.user.role === "student") {
    const enrolled = await env.DB.prepare(
      "SELECT id FROM class_students WHERE class_id = ? AND student_id = ?"
    )
      .bind(assignment.class_id, ctx.user.id)
      .first<{ id: string }>();

    if (!enrolled) {
      return fail("FORBIDDEN", "Nicht in dieser Klasse eingeschrieben", 403);
    }

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
// ============================================================
// GET /api/assignments/:id/submissions — Alle Abgaben (Lehrer)
// ============================================================

export async function handleAssignmentSubmissions(
  request: Request,
  env: Env,
  assignmentId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const roleErr = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleErr) return roleErr;

  // Aufgabe prüfen
  const assignment = await env.DB.prepare(
    `SELECT a.*, s.name_de AS subject_name, c.name AS class_name
     FROM assignments a
     JOIN subjects s ON s.id = a.subject_id
     JOIN classes c ON c.id = a.class_id
     WHERE a.id = ?`
  )
    .bind(assignmentId)
    .first<DbAssignment & { subject_name: string; class_name: string }>();

  if (!assignment) return notFound("Aufgabe nicht gefunden");

  // Zugriff prüfen: nur eigene Aufgabe
  if (ctx.user.role === "teacher" && assignment.teacher_id !== ctx.user.id) {
    return fail("FORBIDDEN", "Diese Aufgabe gehört dir nicht", 403);
  }

  // Alle Schüler der Klasse + Abgaben laden
  const submissions = await env.DB.prepare(
    `SELECT
       u.id AS student_id,
       u.first_name,
       u.last_name,
       u.email,
       s.id AS submission_id,
       s.status,
       s.content,
       s.started_at,
       s.submitted_at,
       s.time_spent_sec,
       s.view_count,
       g.id AS grade_id,
       g.points,
       g.max_points,
       g.feedback,
       g.stars_awarded,
       g.graded_at
     FROM class_students cs
     JOIN users u ON u.id = cs.student_id
     LEFT JOIN submissions s ON s.assignment_id = ? AND s.student_id = u.id
     LEFT JOIN grades g ON g.submission_id = s.id
     WHERE cs.class_id = ?
     ORDER BY u.last_name, u.first_name`
  )
    .bind(assignmentId, assignment.class_id)
    .all();

  // Statistiken
  const stats = {
    total: submissions.results?.length ?? 0,
    not_started: 0,
    in_progress: 0,
    submitted: 0,
    graded: 0,
  };

  for (const row of submissions.results ?? []) {
    const r = row as Record<string, unknown>;
    const status = (r.status as string) ?? "not_started";
    if (status === "not_started") stats.not_started++;
    else if (status === "in_progress") stats.in_progress++;
    else if (status === "submitted") stats.submitted++;
    else if (status === "graded") stats.graded++;
  }

  return ok({
    assignment,
    submissions: submissions.results ?? [],
    stats,
  });
}
