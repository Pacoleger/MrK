import type { Env } from "./types";
import { ok, notFound, fail } from "./lib/response";
import { handlePreflight, withCors } from "./lib/cors";
import { handleHealth } from "./routes/health";
import { handleDbCheck } from "./routes/db-check";
import { handleRegister } from "./routes/auth/register";
import { handleLogin } from "./routes/auth/login";
import { handleLogout } from "./routes/auth/logout";
import { handleMe } from "./routes/auth/me";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ----- CORS Preflight -----
    if (method === "OPTIONS") {
      return handlePreflight(request);
    }

    // ----- Router -----
    let response: Response;

    try {
      // Root
      if (path === "/" || path === "/api") {
        response = ok({
          name: "MrK API",
          version: "0.2.0",
          environment: env.ENVIRONMENT,
          endpoints: [
            "GET  /api/health",
            "GET  /api/db-check",
            "POST /api/auth/register",
            "POST /api/auth/login",
            "POST /api/auth/logout",
            "GET  /api/auth/me",
          ],
          timestamp: new Date().toISOString(),
        });
      }

      // Health & DB
      else if (path === "/api/health") {
        response = await handleHealth(request, env);
      } else if (path === "/api/db-check") {
        response = await handleDbCheck(request, env);
      }

      // Auth
      else if (path === "/api/auth/register") {
        response = await handleRegister(request, env);
      } else if (path === "/api/auth/login") {
        response = await handleLogin(request, env);
      } else if (path === "/api/auth/logout") {
        response = await handleLogout(request, env);
      } else if (path === "/api/auth/me") {
        response = await handleMe(request, env);
      }

      // 404
      else {
        response = notFound(`Route ${method} ${path} not found`);
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
