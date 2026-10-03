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
