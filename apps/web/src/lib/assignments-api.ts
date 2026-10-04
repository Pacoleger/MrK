import { apiGet, apiPost } from "./api";

// ============================================================
// Types
// ============================================================

export type AssignmentType = "homework" | "exercise" | "test" | "quiz" | "project";
export type SubmissionStatus = "not_started" | "in_progress" | "submitted" | "graded";

export interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  type: AssignmentType;
  max_points: number;
  due_date: string | null;
  is_published: number;
  solution_file_url: string | null;
  created_at: string;
  updated_at: string;
  subject_name?: string;
  class_name?: string;
  teacher_first?: string;
  teacher_last?: string;
  submission_status?: SubmissionStatus;
  submission_id?: string;
  submitted_at?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  content: string | null;
  started_at: string | null;
  submitted_at: string | null;
  time_spent_sec: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface CreateAssignmentData {
  classId: string;
  subjectId: string;
  title: string;
  description?: string;
  type?: AssignmentType;
  maxPoints?: number;
  dueDate?: string;
}

// ============================================================
// API
// ============================================================

export const assignmentsApi = {
  list(params?: { classId?: string; subjectId?: string }) {
    const query = new URLSearchParams();
    if (params?.classId) query.set("classId", params.classId);
    if (params?.subjectId) query.set("subjectId", params.subjectId);
    const qs = query.toString();
    return apiGet<{ assignments: Assignment[] }>(
      `/api/assignments${qs ? `?${qs}` : ""}`
    );
  },

  detail(id: string) {
    return apiGet<{ assignment: Assignment; submission?: Submission }>(
      `/api/assignments/${id}`
    );
  },

  create(data: CreateAssignmentData) {
    return apiPost<{ id: string; message: string }>("/api/assignments", data);
  },

  start(assignmentId: string) {
    return apiPost<{ submission: Submission }>(
      `/api/submissions/start/${assignmentId}`
    );
  },

  heartbeat(submissionId: string, seconds: number, viewCount = 0) {
    return apiPost<{ message: string }>(
      `/api/submissions/heartbeat/${submissionId}`,
      { seconds, viewCount }
    );
  },

  submit(submissionId: string, data: { content?: string; timeSpentSec?: number }) {
    return apiPost<{ message: string; submissionId: string }>(
      `/api/submissions/submit/${submissionId}`,
      data
    );
  },

  grade(
    submissionId: string,
    data: { points: number; maxPoints: number; feedback?: string; starsAwarded?: number }
  ) {
    return apiPost<{ message: string }>(
      `/api/submissions/grade/${submissionId}`,
      data
    );
  },

  uploadFile(
    file: File,
    submissionId?: string,
    assignmentId?: string
  ): Promise<{ id: string; url: string; fileName: string; size: number }> {
    const formData = new FormData();
    formData.append("file", file);
    if (submissionId) formData.append("submissionId", submissionId);
    if (assignmentId) formData.append("assignmentId", assignmentId);

    return fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "https://mrk-api.pacokamegne.workers.dev"}/api/uploads`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    )
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.error?.message ?? "Upload failed");
        return j.data;
      });
  },

  listUploads(submissionId: string) {
    return apiGet<{ uploads: Upload[] }>(
      `/api/uploads/submission/${submissionId}`
    );
  },
};
export interface ClassInfo {
  id: string;
  name: string;
  grade_level: number;
  school_year_name?: string;
}

export const classesApi = {
  list() {
    return apiGet<{ classes: ClassInfo[] }>("/api/classes");
  },
};
export interface ClassInfo {
  id: string;
  name: string;
  grade_level: number;
  school_year_name?: string;
}

