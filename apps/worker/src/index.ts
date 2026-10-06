import type { Env } from "./types";
import { ok, notFound, fail } from "./lib/response";
import { handlePreflight, withCors } from "./lib/cors";

// Bestehende Routen
import { handleHealth } from "./routes/health";
import { handleDbCheck } from "./routes/db-check";
import { handleRegister } from "./routes/auth/register";
import { handleLogin } from "./routes/auth/login";
import { handleLogout } from "./routes/auth/logout";
import { handleMe } from "./routes/auth/me";

// Welle 6: Assignments, Submissions, Uploads
import { handleAssignments, handleAssignmentDetail } from "./routes/assignments";
import {
  handleStartSubmission,
  handleHeartbeat,
  handleSubmit,
  handleGrade,
} from "./routes/submissions";
// Admin (Welle 7c)
import {
  handleAdminStats,
  handleAdminUsers,
  handleAdminUpdateUser,
  handleAdminClasses,
  handleAdminDeleteClass,
  handleAdminSchoolYears,
} from "./routes/admin";
import {
  handleUpload,
  handleDownload,
  handleListUploads,
} from "./routes/uploads";
import {
  handleAssignments,
  handleAssignmentDetail,
  handleAssignmentSubmissions,  // ← NEU
} from "./routes/assignments";
// Welle 7a: Quizzes
import {
  handleQuizzes,
  handleQuizDetail,
  handleStartQuizAttempt,
  handleSaveQuizAnswer,
  handleSubmitQuizAttempt,
} from "./routes/quizzes";

// Welle 6: Notifications, Stats, Classes
import {
  handleNotifications,
  handleMarkRead,
  handleMarkAllRead,
} from "./routes/notifications";
import { handleMyStats } from "./routes/stats";
import { handleClasses, handleClassRanking } from "./routes/classes";

// ============================================================
// Router-Helper
// ============================================================

function matchPath(
  pattern: string,
  path: string
): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ============================================================
// Router
// ============================================================

async function route(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response> {
  // -------- Root --------
  if (path === "/" || path === "/api") {
    return ok({
      name: "MrK API",
      version: "0.4.0",
      environment: env.ENVIRONMENT,
      endpoints: [
        "GET    /api/health",
        "GET    /api/db-check",
        // Auth
        "POST   /api/auth/register",
        "POST   /api/auth/login",
        "POST   /api/auth/logout",
        "GET    /api/auth/me",
        // Assignments
        "GET    /api/assignments",
        "POST   /api/assignments",
        "GET    /api/assignments/:id",
        // Submissions
        "POST   /api/submissions/start/:assignmentId",
        "POST   /api/submissions/heartbeat/:submissionId",
        "POST   /api/submissions/submit/:submissionId",
        "POST   /api/submissions/grade/:submissionId",
        // Uploads
        "POST   /api/uploads",
        "GET    /api/uploads/:id/download",
        "GET    /api/uploads/submission/:submissionId",
        // Quizzes
        "GET    /api/quizzes",
        "POST   /api/quizzes",
        "GET    /api/quizzes/:id",
        "POST   /api/quizzes/:id/attempt",
        "POST   /api/quiz-attempts/:id/answer",
        "POST   /api/quiz-attempts/:id/submit",
        // Notifications
        "GET    /api/notifications",
        "POST   /api/notifications/:id/read",
        "POST   /api/notifications/read-all",
        // Stats & Classes
        "GET    /api/stats/me",
        "GET    /api/classes",
        "GET    /api/classes/:id/ranking",
        // Admin
        "GET    /api/admin/stats",
        "GET    /api/admin/users",
        "PATCH  /api/admin/users/:id",
        "GET    /api/admin/classes",
        "POST   /api/admin/classes",
        "DELETE /api/admin/classes/:id",
        "GET    /api/admin/school-years",
        "POST   /api/admin/school-years",
      ],
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================================
  // Health & DB
  // ============================================================
  if (path === "/api/health") return handleHealth(request, env);
  if (path === "/api/db-check") return handleDbCheck(request, env);

  // ============================================================
  // Auth
  // ============================================================
  if (path === "/api/auth/register") return handleRegister(request, env);
  if (path === "/api/auth/login") return handleLogin(request, env);
  if (path === "/api/auth/logout") return handleLogout(request, env);
  if (path === "/api/auth/me") return handleMe(request, env);

  // ============================================================
  // ============================================================
  // Assignments
  // ============================================================
  if (path === "/api/assignments") return handleAssignments(request, env);

  {
    const mSub = matchPath("/api/assignments/:id/submissions", path);
    if (mSub)
      return handleAssignmentSubmissions(request, env, mSub.id);

    const m = matchPath("/api/assignments/:id", path);
    if (m) return handleAssignmentDetail(request, env, m.id);
  }

  // ============================================================
  // Submissions
  // ============================================================
  {
    const mStart = matchPath("/api/submissions/start/:assignmentId", path);
    if (mStart)
      return handleStartSubmission(request, env, mStart.assignmentId);

    const mHeartbeat = matchPath(
      "/api/submissions/heartbeat/:submissionId",
      path
    );
    if (mHeartbeat)
      return handleHeartbeat(request, env, mHeartbeat.submissionId);

    const mSubmit = matchPath(
      "/api/submissions/submit/:submissionId",
      path
    );
    if (mSubmit) return handleSubmit(request, env, mSubmit.submissionId);

    const mGrade = matchPath("/api/submissions/grade/:submissionId", path);
    if (mGrade) return handleGrade(request, env, mGrade.submissionId);
  }

  // ============================================================
  // Uploads
  // ============================================================
  if (path === "/api/uploads") return handleUpload(request, env);

  {
    const mDl = matchPath("/api/uploads/:id/download", path);
    if (mDl) return handleDownload(request, env, mDl.id);

    const mList = matchPath(
      "/api/uploads/submission/:submissionId",
      path
    );
    if (mList) return handleListUploads(request, env, mList.submissionId);
  }

  // ============================================================
  // Quizzes
  // ============================================================
  if (path === "/api/quizzes") return handleQuizzes(request, env);

  {
    const mQuiz = matchPath("/api/quizzes/:id", path);
    if (mQuiz) return handleQuizDetail(request, env, mQuiz.id);

    const mStartQuiz = matchPath("/api/quizzes/:id/attempt", path);
    if (mStartQuiz)
      return handleStartQuizAttempt(request, env, mStartQuiz.id);
  }

  // Quiz Attempts
  {
    const mAnswer = matchPath("/api/quiz-attempts/:id/answer", path);
    if (mAnswer) return handleSaveQuizAnswer(request, env, mAnswer.id);

    const mSubmitQuiz = matchPath("/api/quiz-attempts/:id/submit", path);
    if (mSubmitQuiz)
      return handleSubmitQuizAttempt(request, env, mSubmitQuiz.id);
  }

  // ============================================================
  // Notifications
  // ============================================================
  if (path === "/api/notifications")
    return handleNotifications(request, env);
  if (path === "/api/notifications/read-all")
    return handleMarkAllRead(request, env);

  {
    const mNotif = matchPath("/api/notifications/:id/read", path);
    if (mNotif) return handleMarkRead(request, env, mNotif.id);
  }

  // ============================================================
  // Stats
  // ============================================================
  if (path === "/api/stats/me") return handleMyStats(request, env);
  // ============================================================
  // Admin
  // ============================================================
  if (path === "/api/admin/stats") return handleAdminStats(request, env);

  if (path === "/api/admin/users") return handleAdminUsers(request, env);
  {
    const m = matchPath("/api/admin/users/:id", path);
    if (m) return handleAdminUpdateUser(request, env, m.id);
  }

  if (path === "/api/admin/classes") return handleAdminClasses(request, env);
  {
    const m = matchPath("/api/admin/classes/:id", path);
    if (m) return handleAdminDeleteClass(request, env, m.id);
  }

  if (path === "/api/admin/school-years")
    return handleAdminSchoolYears(request, env);
  // ============================================================
  // Classes
  // ============================================================
  if (path === "/api/classes") return handleClasses(request, env);

  {
    const mClass = matchPath("/api/classes/:id/ranking", path);
    if (mClass) return handleClassRanking(request, env, mClass.id);
  }

  // ============================================================
  // 404
  // ============================================================
  return notFound(`Route ${method} ${path} not found`);
}

// ============================================================
// Main Handler
// ============================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Preflight
    if (method === "OPTIONS") return handlePreflight(request);

    let response: Response;

    try {
      response = await route(request, env, path, method);
    } catch (error) {
      console.error("Unhandled error:", error);
      response = fail(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }

    return withCors(request, response);
  },
} satisfies ExportedHandler<Env>;
