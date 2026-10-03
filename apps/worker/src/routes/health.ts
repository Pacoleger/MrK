import type { Env } from "../types";
import { ok, methodNotAllowed } from "../lib/response";

export async function handleHealth(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  return ok({
    status: "healthy",
    environment: env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
}
