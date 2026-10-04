// ============================================================
// Input Validation
// ============================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== "string" || email.trim() === "") {
    return { valid: false, error: "EMAIL_REQUIRED" };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "EMAIL_INVALID" };
  }
  return { valid: true };
}

export function validatePassword(password: unknown): ValidationResult {
  if (typeof password !== "string" || password === "") {
    return { valid: false, error: "PASSWORD_REQUIRED" };
  }
  if (password.length < 8) {
    return { valid: false, error: "PASSWORD_TOO_SHORT" };
  }
  if (password.length > 200) {
    return { valid: false, error: "PASSWORD_TOO_LONG" };
  }
  return { valid: true };
}

export function validateName(name: unknown, field: string): ValidationResult {
  if (typeof name !== "string" || name.trim() === "") {
    return { valid: false, error: `${field.toUpperCase()}_REQUIRED` };
  }
  if (name.length > 100) {
    return { valid: false, error: `${field.toUpperCase()}_TOO_LONG` };
  }
  return { valid: true };
}

export function validateRole(role: unknown): ValidationResult {
  const allowed = ["admin", "teacher", "student"];
  if (typeof role !== "string" || !allowed.includes(role)) {
    return { valid: false, error: "ROLE_INVALID" };
  }
  // Sicherheit: öffentliche Registrierung nur als student/teacher
  if (role === "admin") {
    return { valid: false, error: "ROLE_FORBIDDEN" };
  }
  return { valid: true };
}

export function validateLocale(locale: unknown): ValidationResult {
  const allowed = ["de", "en", "fr"];
  if (locale === undefined || locale === null) return { valid: true }; // optional
  if (typeof locale !== "string" || !allowed.includes(locale)) {
    return { valid: false, error: "LOCALE_INVALID" };
  }
  return { valid: true };
}
