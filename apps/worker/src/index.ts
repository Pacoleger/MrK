import type { Env } from "./types";
import { ok, notFound, fail } from "./lib/response";
import { handlePreflight, withCors } from "./lib/cors";
import { handleHealth } from "./routes/health";
import { handleDbCheck } from "./routes/db-check";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ----- CORS Preflight -----
    if (request.method === "OPTIONS") {
      return handlePreflight(request);
    }

    // ----- Router -----
    let response: Response;

    try {
      // Root-Endpoint
      if (path === "/" || path === "/api") {
        response = ok({
          name: "MrK API",
          version: "0.1.0",
          environment: env.ENVIRONMENT,
          endpoints: [
            "GET /api/health",
            "GET /api/db-check",
          ],
          timestamp: new Date().toISOString(),
        });
      }

      // Health
      else if (path === "/api/health") {
        response = await handleHealth(request, env);
      }

      // DB-Check
      else if (path === "/api/db-check") {
        response = await handleDbCheck(request, env);
      }

      // 404
      else {
        response = notFound(`Route ${path} not found`);
      }
    } catch (error) {
      console.error("Unhandled error:", error);
      response = fail(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }

    // ----- CORS Headers anhängen -----
    return withCors(request, response);
  },
} satisfies ExportedHandler<Env>;
