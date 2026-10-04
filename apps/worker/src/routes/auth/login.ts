import type { Env, DbUser } from "../../types";
import { ok, fail, methodNotAllowed, serverError } from "../../lib/response";
import { verifyPassword } from "../../lib/crypto";
import { signJwt } from "../../lib/jwt";
import { withAuthCookie } from "../../lib/cookies";
import { logActivity } from "../../lib/logger";
import { validateEmail, validatePassword } from "../../lib/validation";

interface LoginBody {
  email: string;
  password: string;
}

export async function handleLogin(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  if (!env.JWT_SECRET) {
    return serverError("JWT secret not configured");
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return fail("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const emailCheck = validateEmail(body.email);
  const pwCheck = validatePassword(body.password);
  if (!emailCheck.valid || !pwCheck.valid) {
    return fail("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  const email = body.email.trim().toLowerCase();

  // --- User laden ---
  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE email = ? AND is_active = 1"
  )
    .bind(email)
    .first<DbUser>();

  if (!user) {
    // Absichtlich ungenaue Fehlermeldung (verhindert User-Enumeration)
    return fail("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  // --- Passwort prüfen ---
  const valid = await verifyPassword(
    body.password,
    user.password_salt,
    user.password_hash
  );

  if (!valid) {
    await logActivity(env, {
      userId: user.id,
      action: "login",
      metadata: { method: "password", success: false },
      request,
    });
    return fail("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  // --- last_login_at updaten ---
  await env.DB.prepare(
    "UPDATE users SET last_login_at = datetime('now') WHERE id = ?"
  )
    .bind(user.id)
    .run();

  // --- JWT erzeugen ---
  const token = await signJwt(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET
  );

  // --- Activity log ---
  await logActivity(env, {
    userId: user.id,
    action: "login",
    metadata: { method: "password", success: true },
    request,
  });

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
  });

  return withAuthCookie(response, token);
}
