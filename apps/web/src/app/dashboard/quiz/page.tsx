"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Loader2,
  Inbox,
  ListChecks,
  Play,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizCreatorDialog } from "@/components/quiz/quiz-creator-dialog";
import { quizzesApi } from "@/lib/quizzes-api";
import { classesApi, type ClassInfo } from "@/lib/stats-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/lib/quiz-types";

export default function QuizListPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = React.useState<Quiz[]>([]);
  const [classes, setClasses] = React.useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreator, setShowCreator] = React.useState(false);

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.list();
      setQuizzes(data.quizzes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!isTeacher) return;
    classesApi
      .list()
      .then((data) => setClasses(data.classes))
      .catch(console.error);
  }, [isTeacher]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizze</h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? "Erstelle interaktive Quizze für deine Klassen."
              : "Deine verfügbaren Quizze."}
          </p>
        </div>
        {isTeacher && (
          <Button
            onClick={() => setShowCreator(true)}
            disabled={classes.length === 0}
          >
            <Plus className="h-4 w-4" />
            Neues Quiz
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-900 dark:text-red-200">
          {error}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">Keine Quizze</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher
              ? "Erstelle dein erstes Quiz."
              : "Aktuell sind keine Quizze verfügbar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}

      {showCreator && (
        <QuizCreatorDialog
          availableClasses={classes}
          onClose={() => setShowCreator(false)}
          onSuccess={() => {
            setShowCreator(false);
            load();
          }}
        />
      )}
    </div>
  );
}

const subjectColors: Record<string, string> = {
  math: "from-brand-500 to-brand-700",
  physics: "from-accent-500 to-accent-700",
  chemistry: "from-brand-600 to-accent-600",
  biology: "from-accent-400 to-brand-500",
};

function QuizCard({ quiz }: { quiz: Quiz }) {
  const colorClass = subjectColors[quiz.subject_id] ?? "from-brand-500 to-accent-500";
  const hasAttempt = !!quiz.attempt_id;
  const isSubmitted = quiz.attempt_status === "submitted" || quiz.attempt_status === "graded";

  return (
    <Link href={`/dashboard/quiz/detail?id=${quiz.id}`}>
      <Card className="hover:shadow-lg hover:-translate-y-0.5 transition h-full cursor-pointer overflow-hidden">
        <div className={cn("h-1 bg-gradient-to-r", colorClass)} />
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {quiz.subject_name ?? quiz.subject_id}
                {quiz.class_name && ` · ${quiz.class_name}`}
              </p>
              <h3 className="font-semibold mt-1 truncate">{quiz.title}</h3>
            </div>
            {isSubmitted && (
              <Badge variant="success" className="gap-1 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                {quiz.attempt_percentage}%
              </Badge>
            )}
          </div>

          {quiz.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {quiz.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {quiz.question_count ?? 0} Fragen
            </span>
            {isSubmitted ? (
              <span className="flex items-center gap-1 ml-auto text-accent-600 dark:text-accent-400 font-medium">
                <Trophy className="h-3 w-3" />
                {quiz.attempt_score}/{quiz.attempt_max_score}
              </span>
            ) : hasAttempt ? (
              <span className="flex items-center gap-1 ml-auto text-brand-600 dark:text-brand-400 font-medium">
                <Play className="h-3 w-3" />
                Läuft
              </span>
            ) : (
              <span className="ml-auto text-muted-foreground">Neu</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
