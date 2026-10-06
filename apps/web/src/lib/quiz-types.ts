// ============================================================
// Quiz Types (Frontend)
// ============================================================

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "fill_blank"
  | "matching";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "Wahr/Falsch",
  short_answer: "Kurzantwort",
  fill_blank: "Lückentext",
  matching: "Zuordnung",
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  multiple_choice: "ListChecks",
  true_false: "CheckCircle2",
  short_answer: "TextCursorInput",
  fill_blank: "Underline",
  matching: "ArrowLeftRight",
};

export interface QuizQuestionDraft {
  id: string; // temporäre ID für React-Keys
  type: QuestionType;
  question: string;
  explanation?: string;
  points: number;
  // Multiple Choice / True False: Array von Optionen + Index der richtigen
  options?: string[];
  correctIndex?: number;
  // Short Answer / Fill Blank: Array von akzeptierten Antworten
  acceptedAnswers?: string[];
  // Matching: Paare
  pairs?: Array<{ left: string; right: string }>;
}

export interface Quiz {
  id: string;
  assignment_id: string | null;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  time_limit_sec: number | null;
  shuffle_questions: number;
  show_results_immediately: number;
  is_published: number;
  created_at: string;
  updated_at: string;
  subject_name?: string;
  class_name?: string;
  teacher_first?: string;
  teacher_last?: string;
  question_count?: number;
  attempt_status?: string;
  attempt_score?: number;
  attempt_max_score?: number;
  attempt_percentage?: number;
  attempt_id?: string;
}

export interface QuizDetail extends Quiz {
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  type: QuestionType;
  question: string;
  explanation: string | null;
  points: number;
  position: number;
  options: string[] | Record<string, string> | null;
  correct_answer?: unknown; // nur für Lehrer
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  status: "in_progress" | "submitted" | "graded";
  answers: string | null;
  score: number;
  max_score: number;
  percentage: number;
  time_spent_sec: number;
  started_at: string;
  submitted_at: string | null;
}

// Konvertiert einen Frontend-Draft zu einem API-Payload
export function draftToPayload(draft: QuizQuestionDraft) {
  switch (draft.type) {
    case "multiple_choice":
    case "true_false":
      return {
        type: draft.type,
        question: draft.question,
        explanation: draft.explanation,
        points: draft.points,
        options: draft.options,
        correctAnswer: String(draft.correctIndex ?? 0),
      };

    case "short_answer":
      return {
        type: draft.type,
        question: draft.question,
        explanation: draft.explanation,
        points: draft.points,
        correctAnswer: draft.acceptedAnswers?.[0] ?? "",
      };

    case "fill_blank":
      return {
        type: draft.type,
        question: draft.question,
        explanation: draft.explanation,
        points: draft.points,
        correctAnswer: draft.acceptedAnswers ?? [],
      };

    case "matching":
      return {
        type: draft.type,
        question: draft.question,
        explanation: draft.explanation,
        points: draft.points,
        options: draft.pairs?.map((p) => p.left) ?? [],
        correctAnswer: Object.fromEntries(
          (draft.pairs ?? []).map((p) => [p.left, p.right])
        ),
      };
  }
}
