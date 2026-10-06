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
  target_student_id: string | null;
  subject_name?: string;
  class_name?: string;
  teacher_first?: string;
  teacher_last?: string;
  target_first?: string | null;
  target_last?: string | null;
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
