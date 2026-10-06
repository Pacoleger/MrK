import { apiGet, apiPost } from "./api";
import type { Quiz, QuizDetail, QuizAttempt, QuizQuestionDraft } from "./quiz-types";
import { draftToPayload } from "./quiz-types";

// ============================================================
// Quiz API
// ============================================================

export interface CreateQuizData {
  classId: string;
  subjectId: string;
  assignmentId?: string;
  title: string;
  description?: string;
  timeLimitSec?: number;
  shuffleQuestions?: boolean;
  showResultsImmediately?: boolean;
  questions: QuizQuestionDraft[];
}

export const quizzesApi = {
  list(params?: { classId?: string }) {
    const query = new URLSearchParams();
    if (params?.classId) query.set("classId", params.classId);
    const qs = query.toString();
    return apiGet<{ quizzes: Quiz[] }>(`/api/quizzes${qs ? `?${qs}` : ""}`);
  },

  detail(id: string) {
    return apiGet<{
      quiz: Quiz;
      questions: QuizQuestionWithAnswer[];
      attempt?: QuizAttempt | null;
    }>(`/api/quizzes/${id}`);
  },

  create(data: CreateQuizData) {
    const payload = {
      classId: data.classId,
      subjectId: data.subjectId,
      assignmentId: data.assignmentId,
      title: data.title,
      description: data.description,
      timeLimitSec: data.timeLimitSec,
      shuffleQuestions: data.shuffleQuestions,
      showResultsImmediately: data.showResultsImmediately,
      questions: data.questions.map(draftToPayload),
    };
    return apiPost<{ id: string; message: string }>("/api/quizzes", payload);
  },

  startAttempt(quizId: string) {
    return apiPost<{ attempt: QuizAttempt; message?: string }>(
      `/api/quizzes/${quizId}/attempt`
    );
  },

  saveAnswer(
    attemptId: string,
    data: { questionId: string; answer: unknown; timeSpentSec?: number }
  ) {
    return apiPost<{ message: string }>(
      `/api/quiz-attempts/${attemptId}/answer`,
      data
    );
  },

  submitAttempt(attemptId: string) {
    return apiPost<{
      attemptId: string;
      score: number;
      maxScore: number;
      percentage: number;
      starsEarned: number;
      message: string;
    }>(`/api/quiz-attempts/${attemptId}/submit`);
  },
};

interface QuizQuestionWithAnswer {
  id: string;
  quiz_id: string;
  type: string;
  question: string;
  explanation: string | null;
  points: number;
  position: number;
  options: string[] | Record<string, string> | null;
  correct_answer?: unknown;
}
