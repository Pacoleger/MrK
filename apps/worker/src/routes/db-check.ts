import type { Env, DbSubject, DbRole } from "../types";
import { ok, methodNotAllowed, serverError } from "../lib/response";

export async function handleDbCheck(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  try {
    // Fächer laden
    const subjects = await env.DB.prepare(
      "SELECT id, name_de, name_en, name_fr, icon, color FROM subjects ORDER BY id"
    ).all<DbSubject>();

    // Rollen laden
    const roles = await env.DB.prepare(
      "SELECT id, label_de, label_en, label_fr FROM roles ORDER BY id"
    ).all<DbRole>();

    // Tabellen zählen
    const tables = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table'"
    ).first<{ count: number }>();

    return ok({
      database: "mrk-db",
      tables: tables?.count ?? 0,
      subjects: subjects.results ?? [],
      roles: roles.results ?? [],
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB check failed:", error);
    return serverError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
