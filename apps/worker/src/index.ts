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

// Neue Routen (Welle 6)
import { handleAssignments, handleAssignmentDetail } from "./routes/assignments";
import {
  handleStartSubmission,
  handleHeartbeat,
  handleSubmit,
  handleGrade,
} from "./routes/submissions";
import {
  handleUpload,
  handleDownload,
  handleListUploads,
} from "./routes/uploads";
import {
  handleNotifications,
  handleMarkRead,
  handleMarkAllRead,
} from "./routes/notifications";
import { handleMyStats } from "./routes/stats";
import { handleClasses, handleClassRanking } from "./routes/classes";

// ============================================================
// Router-Helper: Match /api/xyz/:id/abc
// ============================================================

function matchPath(pattern: string, path: string): Record<string, string> | null {
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Preflight
    if (method === "OPTIONS") return handlePreflight(request);

    let response: Response;

    try {
      // -------- Root --------
      if (path === "/" || path === "/api") {
        response = ok({
          name: "MrK API",
          version: "0.3.0",
          environment: env.ENVIRONMENT,
          endpoints: [
            "GET    /api/health",
            "GET    /api/db-check",
            "POST   /api/auth/register",
            "POST   /api/auth/login",
            "POST   /api/auth/logout",
            "GET    /api/auth/me",
            "GET    /api/assignments",
            "POST   /api/assignments",
            "GET    /api/assignments/:id",
            "POST   /api/submissions/start/:assignmentId",
            "POST   /api/submissions/heartbeat/:submissionId",
            "POST   /api/submissions/submit/:submissionId",
            "POST   /api/submissions/grade/:submissionId",
            "POST   /api/uploads",
            "GET    /api/uploads/:id/download",
            "GET    /api/uploads/submission/:submissionId",
            "GET    /api/notifications",
            "POST   /api/notifications/:id/read",
            "POST   /api/notifications/read-all",
            "GET    /api/stats/me",
            "GET    /api/classes",
            "GET    /api/classes/:id/ranking",
          ],
          timestamp: new Date().toISOString(),
        });
      }

      // -------- Health & DB --------
      else if (path === "/api/health") response = await handleHealth(request, env);
      else if (path === "/api/db-check") response = await handleDbCheck(request, env);

      // -------- Auth --------
      else if (path === "/api/auth/register") response = await handleRegister(request, env);
      else if (path === "/api/auth/login") response = await handleLogin(request, env);
      else if (path === "/api/auth/logout") response = await handleLogout(request, env);
      else if (path === "/api/auth/me") response = await handleMe(request, env);

      // -------- Assignments --------
      else if (path === "/api/assignments") response = await handleAssignments(request, env);
      else {
        const m = matchPath("/api/assignments/:id", path);
        if (m) {
          response = await handleAssignmentDetail(request, env, m.id);
        } else {
          // -------- Submissions --------
          const mStart = matchPath("/api/submissions/start/:assignmentId", path);
          const mHeartbeat = matchPath("/api/submissions/heartbeat/:submissionId", path);
          const mSubmit = matchPath("/api/submissions/submit/:submissionId", path);
          const mGrade = matchPath("/api/submissions/grade/:submissionId", path);

          if (mStart) {
            response = await handleStartSubmission(request, env, mStart.assignmentId);
          } else if (mHeartbeat) {
            response = await handleHeartbeat(request, env, mHeartbeat.submissionId);
          } else if (mSubmit) {
            response = await handleSubmit(request, env, mSubmit.submissionId);
          } else if (mGrade) {
            response = await handleGrade(request, env, mGrade.submissionId);
          }

          // -------- Uploads --------
          else if (path === "/api/uploads") {
            response = await handleUpload(request, env);
          } else {
            const mDl = matchPath("/api/uploads/:id/download", path);
            const mList = matchPath("/api/uploads/submission/:submissionId", path);

            if (mDl) {
              response = await handleDownload(request, env, mDl.id);
            } else if (mList) {
              response = await handleListUploads(request, env, mList.submissionId);
            }

            // -------- Notifications --------
            else if (path === "/api/notifications") {
              response = await handleNotifications(request, env);
            } else if (path === "/api/notifications/read-all") {
              response = await handleMarkAllRead(request, env);
            } else {
              const mNotif = matchPath("/api/notifications/:id/read", path);
              if (mNotif) {
                response = await handleMarkRead(request, env, mNotif.id);
              }

              // -------- Stats --------
              else if (path === "/api/stats/me") {
                response = await handleMyStats(request, env);
              }

              // -------- Classes --------
              else if (path === "/api/classes") {
                response = await handleClasses(request, env);
              } else {
                const mClass = matchPath("/api/classes/:id/ranking", path);
                if (mClass) {
                  response = await handleClassRanking(request, env, mClass.id);
                }

                // -------- 404 --------
                else {
                  response = notFound(`Route ${method} ${path} not found`);
                }
              }
            }
          }
        }
      }
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
