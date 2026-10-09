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

export interface ClassStudent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  enrolled_at?: string;
}

export interface ClassSubject {
  id: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string | null;
  teacher_first: string | null;
  teacher_last: string | null;
}

export interface ClassDetail {
  class: AdminClass;
  students: ClassStudent[];
  subjects: ClassSubject[];
}

export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface Subject {
  id: string;
  name_de: string;
  name_en: string;
  name_fr: string;
  icon: string | null;
  color: string | null;
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

  classDetail(classId: string) {
    return apiGet<ClassDetail>(`/api/admin/classes/${classId}`);
  },

  deleteClass(classId: string) {
    return apiFetch<{ message: string }>(`/api/admin/classes/${classId}`, {
      method: "DELETE",
    });
  },

  availableStudents(classId: string) {
    return apiGet<{ students: ClassStudent[] }>(
      `/api/admin/classes/${classId}/available-students`
    );
  },

  addStudentToClass(classId: string, studentId: string) {
    return apiPost<{ message: string }>(
      `/api/admin/classes/${classId}/students`,
      { studentId }
    );
  },

  removeStudentFromClass(classId: string, studentId: string) {
    return apiFetch<{ message: string }>(
      `/api/admin/classes/${classId}/students/${studentId}`,
      { method: "DELETE" }
    );
  },

  setHomeroomTeacher(classId: string, teacherId: string | null) {
    return apiPost<{ message: string }>(
      `/api/admin/classes/${classId}/homeroom`,
      { teacherId }
    );
  },

  // ============================================================
  // Subject Assignment (NEU)
  // ============================================================

  addClassSubject(classId: string, subjectId: string, teacherId: string) {
    return apiPost<{ message: string }>(
      `/api/admin/classes/${classId}/subjects`,
      { subjectId, teacherId }
    );
  },

  removeClassSubject(classId: string, subjectId: string) {
    return apiFetch<{ message: string }>(
      `/api/admin/classes/${classId}/subjects/${subjectId}`,
      { method: "DELETE" }
    );
  },

  teachers() {
    return apiGet<{ teachers: Teacher[] }>("/api/admin/teachers");
  },

  subjects() {
    return apiGet<{ subjects: Subject[] }>("/api/admin/subjects");
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
