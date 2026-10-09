import type { Env, DbUser } from "../../types";
import { ok, fail, methodNotAllowed, serverError } from "../../lib/response";
import { uuid, randomBase64, hashPassword } from "../../lib/crypto";
import { signJwt } from "../../lib/jwt";
import { withAuthCookie } from "../../lib/cookies";
import { logActivity } from "../../lib/logger";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateRole,
  validateLocale,
} from "../../lib/validation";

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "student" | "teacher";
  locale?: "de" | "en" | "fr";
  classId?: string;       // Schüler: welche Klasse
  subjectIds?: string[];  // Lehrer: welche Fächer
}

export async function handleRegister(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  if (!env.JWT_SECRET) {
    return serverError("JWT secret not configured");
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return fail("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  // --- Validierung ---
  const checks = [
    validateEmail(body.email),
    validatePassword(body.password),
    validateName(body.firstName, "first_name"),
    validateName(body.lastName, "last_name"),
    validateRole(body.role),
    validateLocale(body.locale),
  ];

  for (const check of checks) {
    if (!check.valid) {
      return fail(check.error!, "Validation failed", 400);
    }
  }

  const email = body.email.trim().toLowerCase();
  const locale = body.locale ?? "de";

  // --- Prüfe ob Email bereits existiert ---
  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  )
    .bind(email)
    .first<{ id: string }>();

  if (existing) {
    return fail("EMAIL_IN_USE", "Email is already registered", 409);
  }

  // --- Klassen-Zuweisung prüfen (nur für Schüler) ---
  let classId: string | null = null;
  if (body.role === "student" && body.classId) {
    const classExists = await env.DB.prepare(
      "SELECT id FROM classes WHERE id = ?"
    )
      .bind(body.classId)
      .first<{ id: string }>();

    if (classExists) {
      classId = body.classId;
    }
  }

  // --- Fächer-Validierung (nur für Lehrer) ---
  let validSubjects: string[] = [];
  if (body.role === "teacher" && body.subjectIds && body.subjectIds.length > 0) {
    // Prüfe, dass alle Fächer existieren
    const placeholders = body.subjectIds.map(() => "?").join(",");
    const found = await env.DB.prepare(
      `SELECT id FROM subjects WHERE id IN (${placeholders})`
    )
      .bind(...body.subjectIds)
      .all<{ id: string }>();

    validSubjects = (found.results ?? []).map((r) => r.id);
  }

  // --- Passwort hashen ---
  const salt = randomBase64(16);
  const passwordHash = await hashPassword(body.password, salt);

  // --- User anlegen ---
  const userId = uuid();
  try {
    await env.DB.prepare(
      `INSERT INTO users
        (id, email, password_hash, password_salt, first_name, last_name, role, locale, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        userId,
        email,
        passwordHash,
        salt,
        body.firstName.trim(),
        body.lastName.trim(),
        body.role,
        locale
      )
      .run();
  } catch (err) {
    console.error("Insert user failed:", err);
    return serverError("Failed to create user");
  }

  // --- Klassen-Zuweisung (falls Schüler + Klasse gewählt) ---
  if (classId) {
    try {
      await env.DB.prepare(
        `INSERT INTO class_students (id, class_id, student_id)
         VALUES (?, ?, ?)`
      )
        .bind(uuid(), classId, userId)
        .run();
      console.log(`[register] User ${userId} → Klasse ${classId}`);
    } catch (err) {
      console.error("Class assignment failed:", err);
    }
  }

  // --- User laden ---
  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId)
    .first<DbUser>();

  if (!user) {
    return serverError("User created but not found");
  }

  // --- JWT erzeugen ---
  const token = await signJwt(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET
  );

  // --- Activity log ---
  await logActivity(env, {
    userId: user.id,
    action: "login",
    metadata: {
      method: "register",
      classId: classId ?? undefined,
      subjects: validSubjects.length > 0 ? validSubjects : undefined,
    },
    request,
  });

  // --- Response mit Cookie ---
  const response = ok({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      locale: user.locale,
    },
    token,
    classAssigned: !!classId,
    subjects: validSubjects,
  });

  return withAuthCookie(response, token);
}
