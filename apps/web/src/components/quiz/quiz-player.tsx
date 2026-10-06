"use client";

import * as React from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuestionRenderer } from "./question-renderer";
import { quizzesApi } from "@/lib/quizzes-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Quiz, QuizQuestion, QuizAttempt } from "@/lib/quiz-types";

export function QuizPlayer({
  quiz,
  questions,
  attempt: initialAttempt,
  onFinish,
}: {
  quiz: Quiz;
  questions: QuizQuestion[];
  attempt: QuizAttempt;
  onFinish: () => void;
}) {
  const [attempt] = React.useState(initialAttempt);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>(() => {
    try {
      return initialAttempt.answers ? JSON.parse(initialAttempt.answers) : {};
    } catch {
      return {};
    }
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [elapsedSec, setElapsedSec] = React.useState(
    initialAttempt.time_spent_sec ?? 0
  );

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  // Timer ticker (lokal)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-save alle 15 Sekunden
  React.useEffect(() => {
    if (totalQuestions === 0) return;

    const interval = setInterval(() => {
      Object.entries(answers).forEach(([questionId, answer]) => {
        quizzesApi
          .saveAnswer(attempt.id, {
            questionId,
            answer,
            timeSpentSec: elapsedSec,
          })
          .catch((err) => console.warn("Auto-save failed:", err));
      });
    }, 15_000);

    return () => clearInterval(interval);
  }, [answers, attempt.id, elapsedSec, totalQuestions]);

  const handleAnswer = async (questionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    try {
      await quizzesApi.saveAnswer(attempt.id, {
        questionId,
        answer,
        timeSpentSec: elapsedSec,
      });
    } catch (err) {
      console.warn("Save failed:", err);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await quizzesApi.submitAttempt(attempt.id);
      onFinish();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Abgabe fehlgeschlagen"
      );
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalTimeLimit = quiz.time_limit_sec;
  const remainingSec = totalTimeLimit
    ? Math.max(0, totalTimeLimit - elapsedSec)
    : null;

  // Auto-submit bei Zeitablauf
  React.useEffect(() => {
    if (remainingSec !== null && remainingSec <= 0 && !isSubmitting) {
      handleSubmit();
    }
  }, [remainingSec, isSubmitting]);

  if (totalQuestions === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Keine Fragen</p>
          <p className="text-sm text-muted-foreground mt-1">
            Dieses Quiz hat keine Fragen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg truncate">{quiz.title}</h1>
              <p className="text-xs text-muted-foreground">
                Frage {currentIndex + 1} von {totalQuestions} ·{" "}
                {answeredCount} beantwortet
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {totalTimeLimit && (
                <Badge
                  variant={remainingSec && remainingSec < 60 ? "destructive" : "outline"}
                  className="gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(remainingSec ?? 0)}
                </Badge>
              )}
              <Badge variant="outline">
                {elapsedSec > 0 && formatTime(elapsedSec)}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Frage {currentIndex + 1}</Badge>
              <Badge variant="outline">{currentQuestion.points} Punkte</Badge>
            </div>
            <p className="text-base font-medium whitespace-pre-wrap">
              {currentQuestion.question}
            </p>
          </div>

          <QuestionRenderer
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswer={(ans) => handleAnswer(currentQuestion.id, ans)}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück
          </Button>

          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                disabled={isSubmitting}
                className={cn(
                  "w-2 h-2 rounded-full transition",
                  i === currentIndex
                    ? "bg-brand-500 w-6"
                    : answers[questions[i].id] !== undefined
                    ? "bg-accent-500"
                    : "bg-muted-foreground/30"
                )}
                aria-label={`Zu Frage ${i + 1}`}
              />
            ))}
          </div>

          {currentIndex < totalQuestions - 1 ? (
            <Button
              onClick={() => setCurrentIndex((i) => i + 1)}
              disabled={isSubmitting}
            >
              Weiter
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-brand-500 to-accent-500"
            >
              <Send className="h-4 w-4" />
              Abgeben
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 grid place-items-center mx-auto">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">Quiz abgeben?</h3>
              <p className="text-sm text-muted-foreground">
                {answeredCount} von {totalQuestions} Fragen beantwortet.
                Nach dem Abgeben kannst du nicht mehr ändern.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird abgegeben...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Abgeben
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helper
// ============================================================

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
