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
// ============================================================
// Assignment / Submission Types
// ============================================================

export interface DbAssignment {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  type: "homework" | "exercise" | "test" | "quiz" | "project";
  max_points: number;
  due_date: string | null;
  is_published: number;
  solution_file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  content: string | null;
  started_at: string | null;
  submitted_at: string | null;
  time_spent_sec: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbUpload {
  id: string;
  submission_id: string | null;
  assignment_id: string | null;
  uploader_id: string;
  file_name: string;
  file_key: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface DbClass {
  id: string;
  name: string;
  grade_level: number;
  school_year_id: string;
  homeroom_teacher_id: string | null;
  created_at: string;
}

export interface DbClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
}
