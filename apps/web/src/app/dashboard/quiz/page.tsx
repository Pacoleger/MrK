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
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  GraduationCap,
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

// ============================================================
// Klappbarer Bereich
// ============================================================

function CollapsibleSection({
  title,
  count,
  icon: Icon,
  children,
  defaultOpen = false,
  isSubSection = false,
}: {
  title: string;
  count: number;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isSubSection?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className={cn(
      "rounded-2xl border border-border overflow-hidden bg-card/30",
      isSubSection && "border-0 bg-transparent rounded-none"
    )}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition text-left",
          !isSubSection && "bg-muted/20"
        )}
      >
        <span className="shrink-0 text-muted-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white shrink-0">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <span className={cn("font-semibold", isSubSection ? "text-sm" : "text-base")}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground ml-2">({count})</span>
      </button>

      {open && (
        <div className={cn(
          "p-4 pt-2",
          !isSubSection && "border-t border-border"
        )}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Hauptseite
// ============================================================

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

  // ============================================================
  // Gruppierung: Fach → (Klasse / Einzelne Schüler)
  // ============================================================
  const grouped = React.useMemo(() => {
    if (!isTeacher) return null;

    const bySubject: Record<string, {
      subjectName: string;
      byClass: Record<string, { className: string; quizzes: Quiz[] }>;
      individualQuizzes: Quiz[];
    }> = {};

    for (const q of quizzes) {
      if (!bySubject[q.subject_id]) {
        bySubject[q.subject_id] = {
          subjectName: q.subject_name ?? q.subject_id,
          byClass: {},
          individualQuizzes: [],
        };
      }

      // Wenn an einzelne Schüler zugeteilt, gehört es zur Sektion "Einzelne"
      if ((q.student_assign_count ?? 0) > 0) {
        bySubject[q.subject_id].individualQuizzes.push(q);
      } else {
        // Sonst zur Klasse
        if (!bySubject[q.subject_id].byClass[q.class_id]) {
          bySubject[q.subject_id].byClass[q.class_id] = {
            className: q.class_name ?? "Unbekannt",
            quizzes: [],
          };
        }
        bySubject[q.subject_id].byClass[q.class_id].quizzes.push(q);
      }
    }
    return Object.values(bySubject);
  }, [quizzes, isTeacher]);

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
      ) : isTeacher && grouped ? (
        // LEHRER-ANSICHT (gruppiert)
        <div className="space-y-10">
          {grouped.map((group) => {
            const totalCount = 
              Object.values(group.byClass).reduce((acc, c) => acc + c.quizzes.length, 0) + 
              group.individualQuizzes.length;

            return (
              <section key={group.subjectName}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-border">
                  <h2 className="text-xl font-bold">{group.subjectName}</h2>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {totalCount} {totalCount === 1 ? "Quiz" : "Quizze"}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Klassen */}
                  {Object.entries(group.byClass).map(([classId, classData]) => (
                    <CollapsibleSection
                      key={classId}
                      title={classData.className}
                      count={classData.quizzes.length}
                      icon={GraduationCap}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classData.quizzes.map((quiz) => (
                          <QuizCard key={quiz.id} quiz={quiz} />
                        ))}
                      </div>
                    </CollapsibleSection>
                  ))}

                  {/* Einzelne Schüler */}
                  {group.individualQuizzes.length > 0 && (
                    <CollapsibleSection
                      title="Einzelne Schüler"
                      count={group.individualQuizzes.length}
                      icon={UserIcon}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.individualQuizzes.map((quiz) => (
                          <QuizCard key={quiz.id} quiz={quiz} />
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        // SCHÜLER-ANSICHT (flach)
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

// ============================================================
// Quiz Card
// ============================================================

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
