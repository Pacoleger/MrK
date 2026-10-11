import { apiGet, apiPost, apiFetch } from "./api";

// ============================================================
// Types
// ============================================================

export interface Material {
  id: string;
  teacher_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  type: "file" | "link" | "html";
  file_key: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  url: string | null;
  content: string | null;
  grade_level: number | null;
  created_at: string;
  updated_at: string;
  subject_name?: string;
  teacher_first?: string;
  teacher_last?: string;
  class_count?: number;
  student_count?: number;
}

export interface MaterialAccess {
  classIds: string[];
  studentIds: string[];
  classes: Array<{ class_id: string; class_name: string }>;
  students: Array<{
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}

export interface SubjectOption {
  id: string;
  name_de: string;
}

// ============================================================
// Constants
// ============================================================

export const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathematik",
  physics: "Physik",
  chemistry: "Chemie",
  biology: "Biologie",
};

export const SUBJECT_ICONS: Record<string, string> = {
  math: "📐",
  physics: "⚛️",
  chemistry: "🧪",
  biology: "🧬",
};

export const GRADE_LEVELS = [7, 8, 9, 10, 11, 12, 13];

// ============================================================
// Materials API
// ============================================================

export const materialsApi = {
  list(params?: { subjectId?: string; gradeLevel?: number }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.set("subjectId", params.subjectId);
    if (params?.gradeLevel !== undefined)
      query.set("gradeLevel", String(params.gradeLevel));
    const qs = query.toString();
    return apiGet<{ materials: Material[] }>(
      `/api/materials${qs ? `?${qs}` : ""}`
    );
  },

  subjects() {
    return apiGet<{ subjects: SubjectOption[] }>("/api/materials/subjects");
  },

  async create(data: {
    type: "file" | "link" | "html";
    title: string;
    description?: string;
    subjectId: string;
    gradeLevel: number;
    file?: File;
    url?: string;
    content?: string;
  }): Promise<{ id: string; message: string }> {
    const formData = new FormData();
    formData.append("type", data.type);
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("subjectId", data.subjectId);
    formData.append("gradeLevel", String(data.gradeLevel));
    if (data.type === "file" && data.file) {
      formData.append("file", data.file);
    }
    if (data.type === "link" && data.url) {
      formData.append("url", data.url);
    }
    if (data.type === "html" && data.content) {
      formData.append("content", data.content);
    }

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ??
      "https://mrk-api.pacokamegne.workers.dev";

    const response = await fetch(`${API_URL}/api/materials/create`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error?.message ?? "Upload fehlgeschlagen");
    }
    return json.data;
  },

  delete(id: string) {
    return apiFetch<{ message: string }>(`/api/materials/${id}`, {
      method: "DELETE",
    });
  },

  access(id: string) {
    return apiGet<MaterialAccess>(`/api/materials/${id}/access`);
  },

  setAccess(id: string, data: { classIds: string[]; studentIds: string[] }) {
    return apiPost<{ message: string }>(`/api/materials/${id}/access`, data);
  },
};
