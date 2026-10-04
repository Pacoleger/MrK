export type Role = "admin" | "teacher" | "student";
export type Locale = "de" | "en" | "fr";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl: string | null;
  locale: Locale;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "student" | "teacher";
  locale?: Locale;
}

export interface AuthResponse {
  user: User;
  token: string;
}
