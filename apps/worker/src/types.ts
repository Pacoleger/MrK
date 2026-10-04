// ============================================================
// Cloudflare Bindings
// ============================================================

export interface Env {
  // D1 Database
  DB: D1Database;

  // R2 Storage (in Welle 4b aktiviert)
  STORAGE?: R2Bucket;

  // Environment Variables
  ENVIRONMENT: string;

  // Secrets (in Welle 4c gesetzt)
  JWT_SECRET?: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================
// DB Row Types (aus D1)
// ============================================================

export interface DbSubject {
  id: string;
  name_de: string;
  name_en: string;
  name_fr: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface DbRole {
  id: string;
  label_de: string;
  label_en: string;
  label_fr: string;
  description: string | null;
  created_at: string;
}
// ============================================================
// Auth Types
// ============================================================

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  first_name: string;
  last_name: string;
  role: "admin" | "teacher" | "student";
  avatar_url: string | null;
  is_active: number;
  locale: "de" | "en" | "fr";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "teacher" | "student";
  avatarUrl: string | null;
  locale: "de" | "en" | "fr";
  createdAt: string;
}

export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthContext {
  user: PublicUser;
  payload: JwtPayload;
}

export function toPublicUser(u: DbUser): PublicUser {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    role: u.role,
    avatarUrl: u.avatar_url,
    locale: u.locale,
    createdAt: u.created_at,
  };
}
