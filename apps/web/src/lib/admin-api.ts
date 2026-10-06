import { apiGet, apiPost, apiFetch } from "./api";

// ============================================================
// Types
// ============================================================

export interface AdminStats {
  users: { admin: number; teacher: number; student: number };
  totalUsers: number;
  classes: number;
  assignments: number;
  submissions: number;
  quizzes: number;
  weeklyActivity: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "teacher" | "student";
  avatar_url: string | null;
  is_active: number;
  locale: string;
  last_login_at: string | null;
  created_at: string;
}

export interface AdminClass {
  id: string;
  name: string;
  grade_level: number;
  school_year_id: string;
  school_year_name: string | null;
  homeroom_teacher_id: string | null;
  teacher_first: string | null;
  teacher_last: string | null;
  student_count: number;
  created_at: string;
}

export interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: number;
  class_count: number;
  created_at: string;
}

// ============================================================
// API
// ============================================================

export const adminApi = {
  stats() {
    return apiGet<AdminStats>("/api/admin/stats");
  },

  users(params?: { role?: string; q?: string }) {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.q) query.set("q", params.q);
    const qs = query.toString();
    return apiGet<{ users: AdminUser[] }>(
      `/api/admin/users${qs ? `?${qs}` : ""}`
    );
  },

  updateUser(
    userId: string,
    data: { role?: string; isActive?: boolean }
  ) {
    return apiFetch<{ message: string }>(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: data,
    });
  },

  classes() {
    return apiGet<{ classes: AdminClass[] }>("/api/admin/classes");
  },

  createClass(data: {
    name: string;
    gradeLevel: number;
    schoolYearId: string;
    homeroomTeacherId?: string;
  }) {
    return apiPost<{ id: string; message: string }>("/api/admin/classes", data);
  },

  deleteClass(classId: string) {
    return apiFetch<{ message: string }>(`/api/admin/classes/${classId}`, {
      method: "DELETE",
    });
  },

  schoolYears() {
    return apiGet<{ schoolYears: SchoolYear[] }>("/api/admin/school-years");
  },

  createSchoolYear(data: {
    name: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
  }) {
    return apiPost<{ id: string; message: string }>(
      "/api/admin/school-years",
      data
    );
  },
};
