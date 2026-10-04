import { apiGet } from "./api";

// ============================================================
// Types
// ============================================================

export interface StudentStats {
  submissions: {
    total: number;
    not_started: number;
    in_progress: number;
    submitted: number;
    graded: number;
  };
  points: {
    earned: number;
    max: number;
  };
  stars: number;
  level: {
    level: number;
    name: string;
    minStars: number;
    nextLevelStars: number | null;
  };
  badges: BadgeInfo[];
  weekly: {
    completed: number;
  };
}

export interface BadgeInfo {
  id: string;
  code: string;
  name_de: string;
  name_en: string;
  name_fr: string;
  icon: string | null;
  color: string | null;
  awarded_at: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade_level: number;
  school_year_name?: string;
}

export interface RankingEntry {
  id: string;
  first_name: string;
  last_name: string;
  total_stars: number;
  completed: number;
}

// ============================================================
// Stats API
// ============================================================

export const statsApi = {
  me() {
    return apiGet<StudentStats>("/api/stats/me");
  },
};

export const classesApi = {
  list() {
    return apiGet<{ classes: ClassInfo[] }>("/api/classes");
  },

  ranking(classId: string) {
    return apiGet<{ ranking: RankingEntry[] }>(
      `/api/classes/${classId}/ranking`
    );
  },
};
