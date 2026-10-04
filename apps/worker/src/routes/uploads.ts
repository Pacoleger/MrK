import type { Env } from "../types";
import { ok, fail, methodNotAllowed, notFound, serverError } from "../lib/response";
import { uuid } from "../lib/crypto";
import { requireAuth, isAuthError } from "../middleware/auth";
import { logActivity } from "../lib/logger";
import { validateFile, makeFileKey } from "../lib/file-utils";

// ============================================================
// POST /api/uploads — Datei hochladen (multipart/form-data)
// ============================================================

export async function handleUpload(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  if (!env.STORAGE) {
    return serverError("Storage not configured");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("INVALID_FORM", "Expected multipart/form-data", 400);
  }

  const file = formData.get("file") as File | null;
  const submissionId = formData.get("submissionId") as string | null;
  const assignmentId = formData.get("assignmentId") as string | null;

  if (!file) return fail("FILE_REQUIRED", "No file provided", 400);

  const check = validateFile(file);
  if (!check.valid) {
    return fail(check.error!, "File validation failed", 400);
  }

  const key = makeFileKey("submissions", ctx.user.id, file.name);
  const arrayBuffer = await file.arrayBuffer();

  try {
    await env.STORAGE.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        uploaderId: ctx.user.id,
        originalName: file.name,
      },
    });
  } catch (err) {
    console.error("R2 put error:", err);
    return serverError("Failed to store file");
  }

  const uploadId = uuid();
  try {
    await env.DB.prepare(
      `INSERT INTO uploads (id, submission_id, assignment_id, uploader_id, file_name, file_key, file_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        uploadId,
        submissionId,
        assignmentId,
        ctx.user.id,
        file.name,
        key,
        file.type,
        file.size
      )
      .run();
  } catch (err) {
    console.error("Upload DB insert error:", err);
  }

  await logActivity(env, {
    userId: ctx.user.id,
    action: "upload_file",
    targetType: "submission",
    targetId: submissionId ?? undefined,
    metadata: { fileName: file.name, size: file.size },
    request,
  });

  return ok({
    id: uploadId,
    key,
    url: `/api/uploads/${uploadId}/download`,
    fileName: file.name,
    size: file.size,
  });
}

// ============================================================
// GET /api/uploads/:id/download
// ============================================================

export async function handleDownload(
  request: Request,
  env: Env,
  uploadId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (!env.STORAGE) return serverError("Storage not configured");

  const upload = await env.DB.prepare("SELECT * FROM uploads WHERE id = ?")
    .bind(uploadId)
    .first<{
      id: string;
      file_key: string;
      file_name: string;
      file_type: string;
      uploader_id: string;
      submission_id: string | null;
    }>();

  if (!upload) return notFound("Upload not found");

  const object = await env.STORAGE.get(upload.file_key);
  if (!object) return notFound("File not found in storage");

  const headers = new Headers();
  headers.set("Content-Type", upload.file_type);
  headers.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(upload.file_name)}"`
  );

  return new Response(object.body, { headers });
}

// ============================================================
// GET /api/uploads/submission/:submissionId — Liste
// ============================================================

export async function handleListUploads(
  request: Request,
  env: Env,
  submissionId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const uploads = await env.DB.prepare(
    `SELECT id, file_name, file_type, file_size, created_at
     FROM uploads WHERE submission_id = ?
     ORDER BY created_at DESC`
  )
    .bind(submissionId)
    .all();

  return ok({ uploads: uploads.results ?? [] });
}
