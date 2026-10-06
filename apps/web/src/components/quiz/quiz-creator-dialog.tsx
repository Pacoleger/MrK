"use client";

import * as React from "react";
import { X, Plus, Loader2, Save, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuestionEditor, makeDraft, QUESTION_TYPES } from "./question-editor";
import { quizzesApi } from "@/lib/quizzes-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { QuizQuestionDraft, QuestionType } from "@/lib/quiz-types";

const SUBJECTS = [
  { id: "math", label: "Mathematik" },
  { id: "physics", label: "Physik" },
  { id: "chemistry", label: "Chemie" },
  { id: "biology", label: "Biologie" },
];

export function QuizCreatorDialog({
  availableClasses,
  onClose,
  onSuccess,
}: {
  availableClasses: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [classId, setClassId] = React.useState(availableClasses[0]?.id ?? "");
  const [subjectId, setSubjectId] = React.useState("math");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [questions, setQuestions] = React.useState<QuizQuestionDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, makeDraft(type)]);
  };

  const updateQuestion = (index: number, updated: QuizQuestionDraft) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? updated : q))
    );
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);

    if (!classId) return setError("Klasse ist erforderlich");
    if (!title.trim()) return setError("Titel ist erforderlich");
    if (questions.length === 0) return setError("Mindestens eine Frage");

    // Validierung: alle Fragen ausgefüllt?
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        return setError(`Frage ${i + 1}: Frage ist leer`);
      }

      if (q.type === "multiple_choice") {
        if (!q.options || q.options.some((o) => !o.trim())) {
          return setError(`Frage ${i + 1}: Alle Optionen müssen ausgefüllt sein`);
        }
      }

      if (q.type === "short_answer" || q.type === "fill_blank") {
        if (
          !q.acceptedAnswers ||
          q.acceptedAnswers.filter((a) => a.trim()).length === 0
        ) {
          return setError(`Frage ${i + 1}: Mindestens eine Antwort`);
        }
      }

      if (q.type === "matching") {
        if (!q.pairs || q.pairs.some((p) => !p.left.trim() || !p.right.trim())) {
          return setError(`Frage ${i + 1}: Alle Paare müssen ausgefüllt sein`);
        }
      }
    }

    setIsSubmitting(true);
    try {
      await quizzesApi.create({
        classId,
        subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        questions,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Quiz konnte nicht erstellt werden"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl border border-border max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Neues Quiz</h2>
              <p className="text-xs text-muted-foreground">
                {questions.length} Fragen · {totalPoints} Punkte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Klasse</Label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Fach</Label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Titel</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Bruchrechnung Quiz"
            />
          </div>

          <div className="space-y-2">
            <Label>Beschreibung (optional)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung..."
              className="w-full min-h-[60px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-y"
            />
          </div>

          {/* Fragen */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fragen ({questions.length})</Label>
              {questions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {totalPoints} Punkte gesamt
                </span>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                <ListChecks className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Noch keine Fragen. Wähle unten einen Fragetyp.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    index={i}
                    total={questions.length}
                    onChange={(updated) => updateQuestion(i, updated)}
                    onDelete={() => deleteQuestion(i)}
                    onMoveUp={() => moveQuestion(i, "up")}
                    onMoveDown={() => moveQuestion(i, "down")}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add Question */}
          <div className="space-y-2">
            <Label>Frage hinzufügen</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {QUESTION_TYPES.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => addQuestion(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-brand-400 hover:bg-muted/50 transition text-xs"
                  )}
                >
                  <Icon className="h-5 w-5 text-brand-600" />
                  <span className="font-medium">
                    {value === "multiple_choice" && "Multiple Choice"}
                    {value === "true_false" && "Wahr/Falsch"}
                    {value === "short_answer" && "Kurzantwort"}
                    {value === "fill_blank" && "Lückentext"}
                    {value === "matching" && "Zuordnung"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || questions.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Erstellen...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Quiz erstellen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
