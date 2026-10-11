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
import { validateFile, makeFileKey } from "../lib/file-utils";
import { createNotification } from "../lib/gamification";

// ============================================================
// GET /api/materials
// ============================================================

export async function handleMaterials(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId");

  try {
    if (ctx.user.role === "teacher" || ctx.user.role === "admin") {
      // ---- LEHRER: Eigene Materialien ----
      let query = `
        SELECT 
          m.id, m.teacher_id, m.subject_id, m.title, m.description, m.type,
          m.file_key, m.file_name, m.file_type, m.file_size, m.url, m.content,
          m.created_at, m.updated_at,
          s.name_de AS subject_name,
          u.first_name AS teacher_first, 
          u.last_name AS teacher_last,
          (SELECT COUNT(*) FROM material_classes WHERE material_id = m.id) AS class_count,
          (SELECT COUNT(*) FROM material_students WHERE material_id = m.id) AS student_count
        FROM materials m
        LEFT JOIN subjects s ON s.id = m.subject_id
        LEFT JOIN users u ON u.id = m.teacher_id
        WHERE m.teacher_id = ?
      `;
      const params: string[] = [ctx.user.id];

      if (subjectId) {
        query += " AND m.subject_id = ?";
        params.push(subjectId);
      }

      query += " ORDER BY m.created_at DESC";

      const result = await env.DB.prepare(query).bind(...params).all();
      console.log(`[listMaterials] Teacher ${ctx.user.id}: ${result.results?.length ?? 0} materials`);
      return ok({ materials: result.results ?? [] });
    }

    // ---- SCHÜLER: Freigeschaltete Materialien ----
    let query = `
      SELECT 
        m.id, m.teacher_id, m.subject_id, m.title, m.description, m.type,
        m.file_key, m.file_name, m.file_type, m.file_size, m.url, m.content,
        m.created_at, m.updated_at,
        s.name_de AS subject_name,
        u.first_name AS teacher_first, 
        u.last_name AS teacher_last
      FROM materials m
      LEFT JOIN subjects s ON s.id = m.subject_id
      LEFT JOIN users u ON u.id = m.teacher_id
      WHERE (
        EXISTS (
          SELECT 1 FROM material_classes mc
          JOIN class_students cs ON cs.class_id = mc.class_id
          WHERE mc.material_id = m.id AND cs.student_id = ?
        )
        OR EXISTS (
          SELECT 1 FROM material_students ms
          WHERE ms.material_id = m.id AND ms.student_id = ?
        )
      )
    `;
    const params: string[] = [ctx.user.id, ctx.user.id];

    if (subjectId) {
      query += " AND m.subject_id = ?";
      params.push(subjectId);
    }

    query += " ORDER BY m.created_at DESC";

    const result = await env.DB.prepare(query).bind(...params).all();
    console.log(`[listMaterials] Student ${ctx.user.id}: ${result.results?.length ?? 0} materials`);
    return ok({ materials: result.results ?? [] });
  } catch (err) {
    console.error("listMaterials error:", err);
    return fail(
      "DB_ERROR",
      err instanceof Error ? err.message : "Datenbankfehler",
      500
    );
  }
}

// ============================================================
// POST /api/materials/create
// ============================================================

export async function handleCreateMaterial(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  const roleErr = requireRole(ctx as never, ["teacher", "admin"]);
  if (roleErr) return roleErr;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("INVALID_FORM", "Erwartet multipart/form-data", 400);
  }

  const type = formData.get("type") as "file" | "link" | "html" | null;
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const subjectId = (formData.get("subjectId") as string | null)?.trim();
  const url = (formData.get("url") as string | null)?.trim();
  const content = (formData.get("content") as string | null)?.trim();
  const file = formData.get("file") as File | null;

  if (!title) return fail("TITLE_REQUIRED", "Titel ist erforderlich", 400);
  if (!subjectId) return fail("SUBJECT_REQUIRED", "Fach ist erforderlich", 400);
  if (!type) return fail("TYPE_REQUIRED", "Typ ist erforderlich", 400);

  if (type === "file" && !file) {
    return fail("FILE_REQUIRED", "Datei ist erforderlich", 400);
  }
  if (type === "link" && !url) {
    return fail("URL_REQUIRED", "URL ist erforderlich", 400);
  }
  if (type === "html" && !content) {
    return fail("CONTENT_REQUIRED", "Inhalt ist erforderlich", 400);
  }

  const subject = await env.DB.prepare("SELECT id FROM subjects WHERE id = ?")
    .bind(subjectId)
    .first<{ id: string }>();
  if (!subject) return notFound("Fach nicht gefunden");

  const materialId = uuid();
  let fileKey: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;
  let fileSize: number | null = null;
  let linkUrl: string | null = null;
  let htmlContent: string | null = null;

  if (type === "file" && file) {
    if (!env.STORAGE) {
      return serverError("Storage nicht konfiguriert");
    }

    const check = validateFile(file);
    if (!check.valid) {
      return fail(check.error!, "Datei-Validierung fehlgeschlagen", 400);
    }

    fileKey = makeFileKey("materials", ctx.user.id, file.name);
    const arrayBuffer = await file.arrayBuffer();

    try {
      await env.STORAGE.put(fileKey, arrayBuffer, {
        httpMetadata: { contentType: file.type },
        customMetadata: {
          uploaderId: ctx.user.id,
          originalName: file.name,
        },
      });
    } catch (err) {
      console.error("R2 put error:", err);
      return serverError("Datei konnte nicht gespeichert werden");
    }

    fileName = file.name;
    fileType = file.type;
    fileSize = file.size;
  } else if (type === "link") {
    linkUrl = url!;
  } else if (type === "html") {
    htmlContent = content!;
  }

  try {
    await env.DB.prepare(
      `INSERT INTO materials
        (id, teacher_id, subject_id, title, description, type,
         file_key, file_name, file_type, file_size, url, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        materialId,
        ctx.user.id,
        subjectId,
        title,
        description || null,
        type,
        fileKey,
        fileName,
        fileType,
        fileSize,
        linkUrl,
        htmlContent
      )
      .run();
  } catch (err) {
    console.error("Insert material error:", err);
    return serverError("Material konnte nicht erstellt werden");
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "upload_file",
    targetType: "material",
    targetId: materialId,
    metadata: { title, type, subjectId },
    request,
  });

  return ok({ id: materialId, message: "Material erstellt" });
}

// ============================================================
// DELETE /api/materials/:id
// ============================================================

export async function handleDeleteMaterial(
  request: Request,
  env: Env,
  materialId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "DELETE") return methodNotAllowed(["DELETE"]);

  const material = await env.DB.prepare(
    "SELECT id, teacher_id, file_key FROM materials WHERE id = ?"
  )
    .bind(materialId)
    .first<{ id: string; teacher_id: string; file_key: string | null }>();

  if (!material) return notFound("Material nicht gefunden");

  if (ctx.user.role !== "admin" && material.teacher_id !== ctx.user.id) {
    return fail("FORBIDDEN", "Kein Zugriff", 403);
  }

  if (material.file_key && env.STORAGE) {
    try {
      await env.STORAGE.delete(material.file_key);
    } catch (err) {
      console.error("R2 delete error:", err);
    }
  }

  try {
    await env.DB.prepare("DELETE FROM materials WHERE id = ?")
      .bind(materialId)
      .run();
  } catch (err) {
    console.error("Delete material error:", err);
    return serverError("Material konnte nicht gelöscht werden");
  }

  return ok({ message: "Material gelöscht" });
}

// ============================================================
// GET /api/materials/:id/download
// ============================================================

export async function handleMaterialDownload(
  request: Request,
  env: Env,
  materialId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (!env.STORAGE) return serverError("Storage nicht konfiguriert");

  const material = await env.DB.prepare(
    "SELECT file_key, file_name, file_type, teacher_id FROM materials WHERE id = ?"
  )
    .bind(materialId)
    .first<{
      file_key: string | null;
      file_name: string | null;
      file_type: string | null;
      teacher_id: string;
    }>();

  if (!material) return notFound("Material nicht gefunden");
  if (!material.file_key) return notFound("Keine Datei zu diesem Material");

  if (ctx.user.role !== "admin" && material.teacher_id !== ctx.user.id) {
    const hasAccess = await env.DB.prepare(
      `SELECT 1 FROM materials m
       WHERE m.id = ?
         AND (
           EXISTS (
             SELECT 1 FROM material_classes mc
             JOIN class_students cs ON cs.class_id = mc.class_id
             WHERE mc.material_id = m.id AND cs.student_id = ?
           )
           OR EXISTS (
             SELECT 1 FROM material_students ms
             WHERE ms.material_id = m.id AND ms.student_id = ?
           )
         )`
    )
      .bind(materialId, ctx.user.id, ctx.user.id)
      .first();

    if (!hasAccess) {
      return fail("FORBIDDEN", "Kein Zugriff auf dieses Material", 403);
    }
  }

  const object = await env.STORAGE.get(material.file_key);
  if (!object) return notFound("Datei nicht gefunden");

  const headers = new Headers();
  headers.set("Content-Type", material.file_type || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(material.file_name || "file")}"`
  );

  return new Response(object.body, { headers });
}

// ============================================================
// POST /api/materials/:id/access
// ============================================================

export async function handleSetMaterialAccess(
  request: Request,
  env: Env,
  materialId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  const material = await env.DB.prepare(
    "SELECT id, teacher_id, title FROM materials WHERE id = ?"
  )
    .bind(materialId)
    .first<{ id: string; teacher_id: string; title: string }>();

  if (!material) return notFound("Material nicht gefunden");

  if (ctx.user.role !== "admin" && material.teacher_id !== ctx.user.id) {
    return fail("FORBIDDEN", "Kein Zugriff", 403);
  }

  let body: { classIds?: string[]; studentIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  const classIds = body.classIds ?? [];
  const studentIds = body.studentIds ?? [];

  try {
    await env.DB.prepare("DELETE FROM material_classes WHERE material_id = ?")
      .bind(materialId)
      .run();
    await env.DB.prepare("DELETE FROM material_students WHERE material_id = ?")
      .bind(materialId)
      .run();

    for (const classId of classIds) {
      await env.DB.prepare(
        `INSERT INTO material_classes (id, material_id, class_id)
         VALUES (?, ?, ?)`
      )
        .bind(uuid(), materialId, classId)
        .run();
    }

    for (const studentId of studentIds) {
      await env.DB.prepare(
        `INSERT INTO material_students (id, material_id, student_id)
         VALUES (?, ?, ?)`
      )
        .bind(uuid(), materialId, studentId)
        .run();
    }

    try {
      const allStudentIds = new Set<string>();

      if (classIds.length > 0) {
        const placeholders = classIds.map(() => "?").join(",");
        const inClasses = await env.DB.prepare(
          `SELECT DISTINCT student_id FROM class_students WHERE class_id IN (${placeholders})`
        )
          .bind(...classIds)
          .all<{ student_id: string }>();

        for (const s of inClasses.results ?? []) {
          allStudentIds.add(s.student_id);
        }
      }

      for (const sid of studentIds) {
        allStudentIds.add(sid);
      }

      for (const sid of allStudentIds) {
        await createNotification(
          env,
          sid,
          "new_material",
          "Neues Material",
          material.title,
          "/dashboard/materialien"
        );
      }
    } catch (err) {
      console.error("Notification failed:", err);
    }
  } catch (err) {
    console.error("setMaterialAccess error:", err);
    return serverError("Freischaltung fehlgeschlagen");
  }

  return ok({ message: "Freischaltung aktualisiert" });
}

// ============================================================
// GET /api/materials/:id/access
// ============================================================

export async function handleGetMaterialAccess(
  request: Request,
  env: Env,
  materialId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const material = await env.DB.prepare(
    "SELECT teacher_id FROM materials WHERE id = ?"
  )
    .bind(materialId)
    .first<{ teacher_id: string }>();

  if (!material) return notFound("Material nicht gefunden");

  if (ctx.user.role !== "admin" && material.teacher_id !== ctx.user.id) {
    return fail("FORBIDDEN", "Kein Zugriff", 403);
  }

  try {
    const classes = await env.DB.prepare(
      `SELECT mc.class_id, c.name AS class_name
       FROM material_classes mc
       JOIN classes c ON c.id = mc.class_id
       WHERE mc.material_id = ?`
    )
      .bind(materialId)
      .all<{ class_id: string; class_name: string }>();

    const students = await env.DB.prepare(
      `SELECT ms.student_id, u.first_name, u.last_name, u.email
       FROM material_students ms
       JOIN users u ON u.id = ms.student_id
       WHERE ms.material_id = ?`
    )
      .bind(materialId)
      .all<{
        student_id: string;
        first_name: string;
        last_name: string;
        email: string;
      }>();

    return ok({
      classIds: (classes.results ?? []).map((c) => c.class_id),
      studentIds: (students.results ?? []).map((s) => s.student_id),
      classes: classes.results ?? [],
      students: students.results ?? [],
    });
  } catch (err) {
    console.error("getMaterialAccess error:", err);
    return serverError();
  }
}

// ============================================================
// GET /api/materials/subjects
// ============================================================

export async function handleMaterialSubjects(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    const result = await env.DB.prepare(
      "SELECT id, name_de FROM subjects ORDER BY name_de"
    ).all();
    return ok({ subjects: result.results ?? [] });
  } catch (err) {
    console.error("materialSubjects error:", err);
    return serverError();
  }
}
