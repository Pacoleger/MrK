import { apiGet } from "./api";

export interface StudentStats {
  submissions: {
    total: number;
    not_started: number;
    in_progress: number;
    submitted: number;
    graded: number;
  };
  points: { earned: number; max: number };
  stars: number;
  level: {
    level: number;
    name: string;
    minStars: number;
    nextLevelStars: number | null;
  };
  badges: Array<{
    id: string;
    code: string;
    name_de: string;
    name_en: string;
    name_fr: string;
    icon: string;
    color: string;
    awarded_at: string;
  }>;
  weekly: { completed: number };
}

export const statsApi = {
  me() {
    return apiGet<StudentStats>("/api/stats/me");
  },
};
