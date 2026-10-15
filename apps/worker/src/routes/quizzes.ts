import type { Env } from "../types";
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
import { awardStars, createNotification } from "../lib/gamification";
import { validateName } from "../lib/validation";


// ============================================================
// Types
// ============================================================

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "fill_blank"
  | "matching";

interface QuizBody {
  classId?: string;
  subjectId?: string;
  assignmentId?: string;
  title?: string;
  description?: string;
  timeLimitSec?: number;
  shuffleQuestions?: boolean;
  showResultsImmediately?: boolean;
  questions?: Array<{
    type: QuestionType;
    question: string;
    explanation?: string;
    points?: number;
    options?: string[] | Record<string, string>;
    correctAnswer: string | string[] | Record<string, string>;
  }>;
}

// ============================================================
// GET /api/quizzes — Liste (rollenbasiert)
// POST /api/quizzes — Erstellen (Lehrer)
// ============================================================

export async function handleQuizzes(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method === "GET") return listQuizzes(request, env, ctx);
  if (request.method === "POST") return createQuiz(request, env, ctx);

  return methodNotAllowed(["GET", "POST"]);
}

async function listQuizzes(
  request: Request,
  env: Env,
  ctx: { user: { id: string; role: string } }
): Promise<Response> {
  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");
  const onlyMine = url.searchParams.get("mine") === "1";

  try {
    // ============================================================
    // LEHRER / ADMIN
    // ============================================================
    if (ctx.user.role === "teacher" || ctx.user.role === "admin") {
      let query = `
        SELECT q.*, s.name_de AS subject_name, c.name AS class_name,
               u.first_name AS teacher_first, u.last_name AS teacher_last,
               (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
               (SELECT COUNT(*) FROM quiz_assignments WHERE quiz_id = q.id) AS assignment_count
        FROM quizzes q
        JOIN subjects s ON s.id = q.subject_id
        JOIN classes c ON c.id = q.class_id
        LEFT JOIN users u ON u.id = q.teacher_id
        WHERE 1=1
      `;
      const params: string[] = [];

      if (onlyMine) {
        query += " AND q.teacher_id = ?";
        params.push(ctx.user.id);
      }
      if (classId) {
        query += " AND q.class_id = ?";
        params.push(classId);
      }

      query += " ORDER BY q.created_at DESC";

      const result = await env.DB.prepare(query).bind(...params).all();
      return ok({ quizzes: result.results ?? [] });
    }

    // ============================================================
    // SCHÜLER — nur zugeteilte Quizze
    // ============================================================
    const query = `
      SELECT q.*, s.name_de AS subject_name, c.name AS class_name,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
             qa.due_date,
             a.status AS attempt_status,
             a.score AS attempt_score,
             a.max_score AS attempt_max_score,
             a.percentage AS attempt_percentage,
             a.id AS attempt_id
      FROM quizzes q
      JOIN subjects s ON s.id = q.subject_id
      JOIN classes c ON c.id = q.class_id
      JOIN quiz_assignments qa ON qa.quiz_id = q.id AND qa.is_active = 1
      LEFT JOIN class_students cs ON cs.class_id = qa.class_id AND cs.student_id = ?
      LEFT JOIN quiz_attempts a ON a.quiz_id = q.id AND a.student_id = ?
      WHERE q.is_published = 1
        AND (
          qa.student_id = ?
          OR (qa.class_id IS NOT NULL AND cs.student_id IS NOT NULL)
        )
      ORDER BY q.created_at DESC
    `;
    const result = await env.DB.prepare(query)
      .bind(ctx.user.id, ctx.user.id, ctx.user.id)
      .all();

    return ok({ quizzes: result.results ?? [] });
  } catch (err) {
    console.error("listQuizzes error:", err);
    return serverError();
  }
}

async function createQuiz(
  request: Request,
  env: Env,
  ctx: { user: { id: string; role: string } }
): Promise<Response> {
  const roleError = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleError) return roleError;

  let body: QuizBody;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Request-Body", 400);
  }

  console.log("[createQuiz] payload:", JSON.stringify(body, null, 2));

  if (!body.classId) return fail("CLASS_REQUIRED", "classId ist erforderlich", 400);
  if (!body.subjectId) return fail("SUBJECT_REQUIRED", "subjectId ist erforderlich", 400);

  const titleCheck = validateName(body.title, "title");
  if (!titleCheck.valid) return fail(titleCheck.error!, "Titel ist erforderlich", 400);

  if (!body.questions || body.questions.length === 0) {
    return fail("QUESTIONS_REQUIRED", "Mindestens eine Frage ist erforderlich", 400);
  }

  // Klasse prüfen
  const classExists = await env.DB.prepare(
    "SELECT id FROM classes WHERE id = ?"
  )
    .bind(body.classId.trim())
    .first<{ id: string }>();

  if (!classExists) {
    return fail("CLASS_NOT_FOUND", `Klasse "${body.classId}" existiert nicht`, 400);
  }

  const quizId = uuid();

  try {
    // Quiz anlegen
    await env.DB.prepare(
      `INSERT INTO quizzes
        (id, assignment_id, class_id, subject_id, teacher_id, title, description,
         time_limit_sec, shuffle_questions, show_results_immediately, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(
        quizId,
        body.assignmentId || null,
        body.classId.trim(),
        body.subjectId.trim(),
        ctx.user.id,
        body.title!.trim(),
        body.description?.trim() || null,
        body.timeLimitSec ?? null,
        body.shuffleQuestions ? 1 : 0,
        body.showResultsImmediately !== false ? 1 : 0
      )
      .run();

    // Fragen anlegen
    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];
      const validTypes: QuestionType[] = [
        "multiple_choice",
        "true_false",
        "short_answer",
        "fill_blank",
        "matching",
      ];

      if (!validTypes.includes(q.type)) {
        console.warn(`[createQuiz] Invalid question type: ${q.type}`);
        continue;
      }

      await env.DB.prepare(
        `INSERT INTO quiz_questions
          (id, quiz_id, type, question, explanation, points, position, options, correct_answer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          uuid(),
          quizId,
          q.type,
          q.question.trim(),
          q.explanation?.trim() || null,
          Math.max(1, q.points ?? 1),
          i,
          q.options ? JSON.stringify(q.options) : null,
          JSON.stringify(q.correctAnswer)
        )
        .run();
    }

    console.log("[createQuiz] Quiz created:", quizId);
  } catch (err) {
    console.error("[createQuiz] DB error:", err);
    return serverError(
      `DB Fehler: ${err instanceof Error ? err.message : "Unbekannt"}`
    );
  }

  // Notifications an Schüler
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
        "Neues Quiz",
        body.title!.trim(),
        `/dashboard/quiz/${quizId}`
      );
    }
  } catch (err) {
    console.error("[createQuiz] notification failed:", err);
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "create_assignment",
    targetType: "quiz",
    targetId: quizId,
    request,
  });

  return ok({ id: quizId, message: "Quiz erstellt" });
}

// ============================================================
// GET /api/quizzes/:id — Detail mit Fragen
// ============================================================

export async function handleQuizDetail(
  request: Request,
  env: Env,
  quizId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  // Quiz laden
  const quiz = await env.DB.prepare(
    `SELECT q.*, s.name_de AS subject_name, c.name AS class_name,
            u.first_name AS teacher_first, u.last_name AS teacher_last
     FROM quizzes q
     JOIN subjects s ON s.id = q.subject_id
     JOIN classes c ON c.id = q.class_id
     JOIN users u ON u.id = q.teacher_id
     WHERE q.id = ?`
  )
    .bind(quizId)
    .first();

  if (!quiz) return notFound("Quiz nicht gefunden");

  // Zugriffsprüfung für Schüler
  if (ctx.user.role === "student") {
    const classId = (quiz as { class_id: string }).class_id;
    const assigned = await env.DB.prepare(
      `SELECT 1 FROM quiz_assignments qa
       LEFT JOIN class_students cs
         ON cs.class_id = qa.class_id AND cs.student_id = ?
       WHERE qa.quiz_id = ?
         AND qa.is_active = 1
         AND (
           qa.student_id = ?
           OR (qa.class_id IS NOT NULL AND cs.student_id IS NOT NULL)
         )
       LIMIT 1`
    )
      .bind(ctx.user.id, quizId, ctx.user.id)
      .first();

    if (!assigned) {
      return fail(
        "NOT_ASSIGNED",
        "Dieses Quiz wurde dir nicht zugeteilt.",
        403
      );
    }
  }

  // Fragen laden
  const questions = await env.DB.prepare(
    `SELECT id, quiz_id, type, question, explanation, points, position, options
     FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC`
  )
    .bind(quizId)
    .all();

  // Für Schüler: Korrekte Antworten NICHT senden
  let safeQuestions = questions.results ?? [];

  if (ctx.user.role === "student") {
    safeQuestions = (questions.results ?? []).map((q) => {
      const record = q as Record<string, unknown>;
      const { correct_answer, ...rest } = record;

      // options parsen (falls als String)
      let options: unknown = rest.options;
      if (typeof options === "string") {
        try { options = JSON.parse(options); } catch { options = null; }
      }

      let correct: unknown = correct_answer;
      if (typeof correct === "string") {
        try { correct = JSON.parse(correct); } catch { /* bleibt String */ }
      }

      // Matching: rechte Werte mischen und mitsenden (ohne Zuordnung)
      if (record.type === "matching" && correct && typeof correct === "object") {
        const rightValues = Object.values(correct as Record<string, string>);
        // Fisher-Yates Shuffle
        const shuffled = [...rightValues];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        rest.options = {
          left: Array.isArray(options) ? options : [],
          right: shuffled,
        };
      } else {
        rest.options = options;
      }

      return rest;
    });
  } else {
    // Lehrer bekommt correct_answer
    safeQuestions = (questions.results ?? []).map((q) => {
      const record = q as Record<string, unknown>;
      if (record.correct_answer) {
        try {
          record.correct_answer = JSON.parse(record.correct_answer as string);
        } catch {
          // ignore
        }
      }
      if (record.options) {
        try {
          record.options = JSON.parse(record.options as string);
        } catch {
          // ignore
        }
      }
      return record;
    });
  }

  // Für Schüler: aktuellen Versuch laden (falls vorhanden)
  let attempt = null;
  if (ctx.user.role === "student") {
    attempt = await env.DB.prepare(
      `SELECT id, status, score, max_score, percentage, time_spent_sec, started_at, submitted_at
       FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?`
    )
      .bind(quizId, ctx.user.id)
      .first();
  }

  return ok({ quiz, questions: safeQuestions, attempt });
}

// ============================================================
// POST /api/quizzes/:id/attempt — Quiz starten
// ============================================================

export async function handleStartQuizAttempt(
  request: Request,
  env: Env,
  quizId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  if (ctx.user.role !== "student") {
    return fail("FORBIDDEN", "Nur Schüler können Quiz starten", 403);
  }

  // Prüfe ob Quiz existiert und veröffentlicht ist
  const quiz = await env.DB.prepare(
    "SELECT id, is_published, time_limit_sec FROM quizzes WHERE id = ?"
  )
    .bind(quizId)
    .first<{ id: string; is_published: number; time_limit_sec: number | null }>();

  if (!quiz) return notFound("Quiz nicht gefunden");
  if (!quiz.is_published) return fail("NOT_PUBLISHED", "Quiz ist nicht veröffentlicht", 403);
  // Schüler: nur zugeteilte Quizze startbar
  const assigned = await env.DB.prepare(
    `SELECT 1 FROM quiz_assignments qa
     LEFT JOIN class_students cs
       ON cs.class_id = qa.class_id AND cs.student_id = ?
     WHERE qa.quiz_id = ?
       AND qa.is_active = 1
       AND (
         qa.student_id = ?
         OR (qa.class_id IS NOT NULL AND cs.student_id IS NOT NULL)
       )
     LIMIT 1`
  )
    .bind(ctx.user.id, quizId, ctx.user.id)
    .first();

  if (!assigned) {
    return fail(
      "NOT_ASSIGNED",
      "Dieses Quiz wurde dir nicht zugeteilt.",
      403
    );
  }
  // Prüfe ob schon ein Versuch läuft
  const existing = await env.DB.prepare(
    "SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?"
  )
    .bind(quizId, ctx.user.id)
    .first<{
      id: string;
      status: string;
      answers: string | null;
      started_at: string;
      time_spent_sec: number;
    }>();

  if (existing) {
    // Falls submitted → neuen Versuch nicht erlauben (später: retry konfigurierbar)
    if (existing.status !== "in_progress") {
      return ok({ attempt: existing, message: "Versuch existiert bereits" });
    }

    return ok({ attempt: existing });
  }

  // Neuen Versuch anlegen
  const attemptId = uuid();

  try {
    await env.DB.prepare(
      `INSERT INTO quiz_attempts
        (id, quiz_id, student_id, status, answers, max_score)
       VALUES (?, ?, ?, 'in_progress', '{}', 0)`
    )
      .bind(attemptId, quizId, ctx.user.id)
      .run();
  } catch (err) {
    console.error("[startQuizAttempt] error:", err);
    return serverError("Versuch konnte nicht gestartet werden");
  }

  const attempt = await env.DB.prepare(
    "SELECT * FROM quiz_attempts WHERE id = ?"
  )
    .bind(attemptId)
    .first();

  return ok({ attempt });
}

// ============================================================
// POST /api/quiz-attempts/:id/answer — Antwort speichern
// ============================================================

export async function handleSaveQuizAnswer(
  request: Request,
  env: Env,
  attemptId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  let body: { questionId?: string; answer?: unknown; timeSpentSec?: number };
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  if (!body.questionId) return fail("QUESTION_REQUIRED", "questionId fehlt", 400);

  // Versuch laden und prüfen
  const attempt = await env.DB.prepare(
    "SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ?"
  )
    .bind(attemptId, ctx.user.id)
    .first<{
      id: string;
      status: string;
      answers: string | null;
      time_spent_sec: number;
    }>();

  if (!attempt) return notFound("Versuch nicht gefunden");
  if (attempt.status !== "in_progress") {
    return fail("ATTEMPT_LOCKED", "Versuch ist bereits abgegeben", 409);
  }

  // Answers parsen
  let answers: Record<string, unknown> = {};
  try {
    answers = attempt.answers ? JSON.parse(attempt.answers) : {};
  } catch {
    answers = {};
  }

  answers[body.questionId] = body.answer;

  await env.DB.prepare(
    `UPDATE quiz_attempts
     SET answers = ?, time_spent_sec = ?, submitted_at = NULL
     WHERE id = ?`
  )
    .bind(
      JSON.stringify(answers),
      Math.max(0, body.timeSpentSec ?? attempt.time_spent_sec),
      attemptId
    )
    .run();

  return ok({ message: "Antwort gespeichert" });
}

// ============================================================
// POST /api/quiz-attempts/:id/submit — Abgeben + Auswerten
// ============================================================

export async function handleSubmitQuizAttempt(
  request: Request,
  env: Env,
  attemptId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  const attempt = await env.DB.prepare(
    "SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ?"
  )
    .bind(attemptId, ctx.user.id)
    .first<{
      id: string;
      quiz_id: string;
      status: string;
      answers: string | null;
      time_spent_sec: number;
    }>();

  if (!attempt) return notFound("Versuch nicht gefunden");
  if (attempt.status !== "in_progress") {
    return fail("ALREADY_SUBMITTED", "Bereits abgegeben", 409);
  }

  // Fragen laden
  const questions = await env.DB.prepare(
    "SELECT id, type, points, correct_answer FROM quiz_questions WHERE quiz_id = ?"
  )
    .bind(attempt.quiz_id)
    .all<{
      id: string;
      type: QuestionType;
      points: number;
      correct_answer: string;
    }>();

  // Answers parsen
  let answers: Record<string, unknown> = {};
  try {
    answers = attempt.answers ? JSON.parse(attempt.answers) : {};
  } catch {
    answers = {};
  }

  // Auswerten
  let score = 0;
  let maxScore = 0;

  for (const q of questions.results ?? []) {
    maxScore += q.points;
    const studentAnswer = answers[q.id];
    let correctAnswer: unknown;
    try {
      correctAnswer = JSON.parse(q.correct_answer);
    } catch {
      correctAnswer = q.correct_answer;
    }

    if (isAnswerCorrect(q.type, studentAnswer, correctAnswer)) {
      score += q.points;
    }
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  await env.DB.prepare(
    `UPDATE quiz_attempts
     SET status = 'submitted', score = ?, max_score = ?, percentage = ?,
         submitted_at = datetime('now')
     WHERE id = ?`
  )
    .bind(score, maxScore, percentage, attemptId)
    .run();

  // Sterne vergeben
  const starsEarned = Math.floor(score / 10);
  if (starsEarned > 0) {
    await awardStars(
      env,
      ctx.user.id,
      starsEarned,
      "assignment_completed",
      attemptId,
      `Quiz: ${score}/${maxScore} Punkte`
    );
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "submit_assignment",
    targetType: "quiz",
    targetId: attempt.quiz_id,
    metadata: { score, maxScore, percentage, starsEarned },
    request,
  });

  return ok({
    attemptId,
    score,
    maxScore,
    percentage,
    starsEarned,
    message: "Quiz abgegeben",
  });
}

// ============================================================
// Answer-Check Helper
// ============================================================

function isAnswerCorrect(
  type: QuestionType,
  given: unknown,
  correct: unknown
): boolean {
  if (given === undefined || given === null) return false;

  switch (type) {
    case "multiple_choice":
    case "true_false":
      return String(given) === String(correct);

    case "short_answer":
      // Normalisiert: trim + lowercase + Umlaute
      return normalizeText(String(given)) === normalizeText(String(correct));

    case "fill_blank": {
      // correct = Array von erlaubten Antworten
      const correctArr = Array.isArray(correct) ? correct : [correct];
      return correctArr.some(
        (c) => normalizeText(String(given)) === normalizeText(String(c))
      );
    }

    case "matching": {
      // correct = { key: value, ... }
      // given = { key: value, ... }
      if (typeof given !== "object" || typeof correct !== "object") return false;

      const givenObj = given as Record<string, string>;
      const correctObj = correct as Record<string, string>;

      for (const key of Object.keys(correctObj)) {
        if (givenObj[key] !== correctObj[key]) return false;
      }
      return true;
    }

    default:
      return false;
  }
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}
// ============================================================
// POST /api/quizzes/:id/assign
// Body: { classIds?: string[]; studentIds?: string[]; dueDate?: string }
// ============================================================

export async function handleAssignQuiz(
  request: Request,
  env: Env,
  quizId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const roleErr = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleErr) return roleErr;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  const quiz = await env.DB.prepare(
    "SELECT id, teacher_id, title FROM quizzes WHERE id = ?"
  )
    .bind(quizId)
    .first<{ id: string; teacher_id: string; title: string }>();

  if (!quiz) return notFound("Quiz nicht gefunden");

  if (ctx.user.role !== "admin" && quiz.teacher_id !== ctx.user.id) {
    return fail("FORBIDDEN", "Nur der Ersteller darf zuweisen", 403);
  }

  let body: { classIds?: string[]; studentIds?: string[]; dueDate?: string };
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  const classIds = body.classIds ?? [];
  const studentIds = body.studentIds ?? [];
  const dueDate = body.dueDate || null;

  try {
    // Vorhandene Zuteilungen dieses Quiz entfernen (einfacher Reset)
    await env.DB.prepare(
      "DELETE FROM quiz_assignments WHERE quiz_id = ?"
    )
      .bind(quizId)
      .run();

    // Klassen zuweisen
    for (const classId of classIds) {
      await env.DB.prepare(
        `INSERT INTO quiz_assignments
          (id, quiz_id, class_id, student_id, assigned_by, due_date)
         VALUES (?, ?, ?, NULL, ?, ?)`
      )
        .bind(uuid(), quizId, classId, ctx.user.id, dueDate)
        .run();
    }

    // Einzelne Schüler zuweisen
    for (const studentId of studentIds) {
      await env.DB.prepare(
        `INSERT INTO quiz_assignments
          (id, quiz_id, class_id, student_id, assigned_by, due_date)
         VALUES (?, ?, NULL, ?, ?, ?)`
      )
        .bind(uuid(), quizId, studentId, ctx.user.id, dueDate)
        .run();
    }

    // Benachrichtigungen an alle betroffenen Schüler
    const allStudentIds = new Set<string>();

    if (classIds.length > 0) {
      const placeholders = classIds.map(() => "?").join(",");
      const inClasses = await env.DB.prepare(
        `SELECT DISTINCT student_id FROM class_students
         WHERE class_id IN (${placeholders})`
      )
        .bind(...classIds)
        .all<{ student_id: string }>();

      for (const s of inClasses.results ?? []) {
        allStudentIds.add(s.student_id);
      }
    }
    for (const sid of studentIds) allStudentIds.add(sid);

    for (const sid of allStudentIds) {
      await createNotification(
        env,
        sid,
        "new_assignment",
        "Neues Quiz zugeteilt",
        quiz.title,
        `/dashboard/quiz/detail?id=${quizId}`
      );
    }
  } catch (err) {
    console.error("handleAssignQuiz error:", err);
    return serverError("Zuteilung fehlgeschlagen");
  }

  return ok({ message: "Quiz zugeteilt" });
}

// ============================================================
// GET /api/quizzes/:id/assignments — aktuelle Zuteilungen
// ============================================================

export async function handleGetQuizAssignments(
  request: Request,
  env: Env,
  quizId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const roleErr = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleErr) return roleErr;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    const rows = await env.DB.prepare(
      `SELECT id, class_id, student_id, due_date, assigned_at
       FROM quiz_assignments
       WHERE quiz_id = ? AND is_active = 1`
    )
      .bind(quizId)
      .all();

    const classIds = (rows.results ?? [])
      .map((r) => (r as { class_id: string | null }).class_id)
      .filter((x): x is string => !!x);

    const studentIds = (rows.results ?? [])
      .map((r) => (r as { student_id: string | null }).student_id)
      .filter((x): x is string => !!x);

    const dueDate = (rows.results ?? [])
      .map((r) => (r as { due_date: string | null }).due_date)
      .find((x): x is string => !!x) ?? null;

    return ok({ classIds, studentIds, dueDate });
  } catch (err) {
    console.error("handleGetQuizAssignments error:", err);
    return serverError();
  }
}
