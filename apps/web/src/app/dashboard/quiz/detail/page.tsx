"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { QuizResult } from "@/components/quiz/quiz-result";
import { quizzesApi } from "@/lib/quizzes-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import type { Quiz, QuizQuestion, QuizAttempt } from "@/lib/quiz-types";

type ScreenState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "quiz";
      quiz: Quiz;
      questions: QuizQuestion[];
      attempt: QuizAttempt | null;
    }
  | {
      kind: "result";
      score: number;
      maxScore: number;
      percentage: number;
      starsEarned: number;
      timeSpentSec: number;
    };

function QuizDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { user } = useAuth();

  const [state, setState] = React.useState<ScreenState>({ kind: "loading" });

  const isStudent = user?.role === "student";

  const load = React.useCallback(async () => {
    if (!id) {
      setState({ kind: "error", message: "Keine Quiz-ID angegeben" });
      return;
    }

    try {
      const data = await quizzesApi.detail(id);

      // Falls bereits abgegeben → Ergebnis anzeigen
      if (
        isStudent &&
        data.attempt &&
        (data.attempt.status === "submitted" || data.attempt.status === "graded")
      ) {
        setState({
          kind: "result",
          score: data.attempt.score,
          maxScore: data.attempt.max_score,
          percentage: data.attempt.percentage,
          starsEarned: 0, // TODO: aus Log
          timeSpentSec: data.attempt.time_spent_sec,
        });
        return;
      }

      // Falls Schüler und noch nicht gestartet → starten
      if (isStudent && (!data.attempt || data.attempt.status === "in_progress")) {
        const startResult = await quizzesApi.startAttempt(id);
        setState({
          kind: "quiz",
          quiz: data.quiz,
          questions: data.questions as QuizQuestion[],
          attempt: startResult.attempt,
        });
        return;
      }

      // Lehrer: Nur Quiz-Info
      if (!isStudent) {
        setState({
          kind: "quiz",
          quiz: data.quiz,
          questions: data.questions as QuizQuestion[],
          attempt: null,
        });
        return;
      }

      // Fallback
      setState({
        kind: "quiz",
        quiz: data.quiz,
        questions: data.questions as QuizQuestion[],
        attempt: data.attempt ?? null,
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Quiz konnte nicht geladen werden",
      });
    }
  }, [id, isStudent]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (state.kind === "loading") {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="max-w-4xl space-y-4">
        <Link
          href="/dashboard/quiz"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-900 dark:text-red-200">
          {state.message}
        </div>
      </div>
    );
  }

  if (state.kind === "result") {
    return (
      <QuizResult
        score={state.score}
        maxScore={state.maxScore}
        percentage={state.percentage}
        starsEarned={state.starsEarned}
        timeSpentSec={state.timeSpentSec}
      />
    );
  }

  // Lehrer-Ansicht: Quiz ohne Player
  if (!isStudent) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link
          href="/dashboard/quiz"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Quizzen
        </Link>

        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-2xl font-bold">{state.quiz.title}</h1>
          {state.quiz.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {state.quiz.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            {state.questions.length} Fragen
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Fragen</h2>
          {state.questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-sm font-medium mb-2">
                {i + 1}. {q.question}
              </p>
              {q.options && Array.isArray(q.options) && (
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  {q.options.map((opt, oi) => (
                    <li key={oi}>· {opt}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {q.points} Punkt{q.points !== 1 ? "e" : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Schüler: Quiz spielen
  if (!state.attempt) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-900 dark:text-amber-200">
          Quiz konnte nicht gestartet werden.
        </div>
      </div>
    );
  }

  const currentAttempt = state.attempt;

  return (
    <QuizPlayer
      quiz={state.quiz}
      questions={state.questions}
      attempt={currentAttempt}
      onFinish={(result) => {
        // Direkt Ergebnis anzeigen (statt neu laden)
        setState({
          kind: "result",
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage,
          starsEarned: result.starsEarned,
          timeSpentSec: result.timeSpentSec ?? currentAttempt.time_spent_sec,
        });
      }}
    />
  );
}

export default function QuizDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <QuizDetailInner />
    </Suspense>
  );
}
