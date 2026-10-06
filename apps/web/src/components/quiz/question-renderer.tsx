"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  CheckCircle2,
  Circle,
  ListChecks,
} from "lucide-react";
import type { QuizQuestion } from "@/lib/quiz-types";

// ============================================================
// Question Renderer (für Schüler)
// ============================================================

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
  disabled,
}: {
  question: QuizQuestion;
  answer: unknown;
  onAnswer: (answer: unknown) => void;
  disabled?: boolean;
}) {
  switch (question.type) {
    case "multiple_choice":
      return (
        <MultipleChoiceQuestion
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "true_false":
      return (
        <TrueFalseQuestion
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "short_answer":
      return (
        <ShortAnswerQuestion
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "fill_blank":
      return (
        <ShortAnswerQuestion
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "matching":
      return (
        <MatchingQuestion
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
  }
}

// ============================================================
// Multiple Choice
// ============================================================

function MultipleChoiceQuestion({
  question,
  answer,
  onAnswer,
  disabled,
}: {
  question: QuizQuestion;
  answer: unknown;
  onAnswer: (answer: unknown) => void;
  disabled?: boolean;
}) {
  const options = Array.isArray(question.options) ? question.options : [];

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const selected = String(answer ?? "") === String(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onAnswer(String(i))}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition",
              selected
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-border hover:border-brand-300 hover:bg-muted/50",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 transition",
                selected
                  ? "border-brand-500 bg-brand-500"
                  : "border-muted-foreground/40"
              )}
            >
              {selected && <Circle className="h-2.5 w-2.5 fill-white text-white" />}
            </div>
            <span className="text-sm">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// True / False
// ============================================================

function TrueFalseQuestion({
  question,
  answer,
  onAnswer,
  disabled,
}: {
  question: QuizQuestion;
  answer: unknown;
  onAnswer: (answer: unknown) => void;
  disabled?: boolean;
}) {
  const options = Array.isArray(question.options)
    ? question.options
    : ["Wahr", "Falsch"];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt, i) => {
        const selected = String(answer ?? "") === String(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onAnswer(String(i))}
            disabled={disabled}
            className={cn(
              "p-6 rounded-xl border-2 font-semibold transition",
              selected
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                : "border-border hover:border-brand-300",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Short Answer / Fill Blank
// ============================================================

function ShortAnswerQuestion({
  question,
  answer,
  onAnswer,
  disabled,
}: {
  question: QuizQuestion;
  answer: unknown;
  onAnswer: (answer: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Input
        value={String(answer ?? "")}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Deine Antwort..."
        disabled={disabled}
        className="text-base"
        autoComplete="off"
      />
      <p className="text-xs text-muted-foreground">
        Groß-/Kleinschreibung wird nicht unterschieden.
      </p>
    </div>
  );
}

// ============================================================
// Matching
// ============================================================

function MatchingQuestion({
  question,
  answer,
  onAnswer,
  disabled,
}: {
  question: QuizQuestion;
  answer: unknown;
  onAnswer: (answer: unknown) => void;
  disabled?: boolean;
}) {
  // question.options ist ein Array von "linken" Werten
  const leftItems = Array.isArray(question.options) ? question.options : [];

  // Der Schüler wählt für jedes linke Element ein rechtes aus.
  // Rechte Optionen = alle linken Werte, aber wir mischen sie NICHT —
  // der Nutzer ordnet zu, indem er für jede "linke" Position ein "rechtes" auswählt.
  // Da wir keinen Zugriff auf die "rechten" Werte in der Frage haben (die sind correct_answer),
  // müssen wir tricksen: Bei matching speichern wir die rechten Werte
  // auch in question.options als zweites Element? Nein.
  //
  // Deshalb: Wir senden beim Quiz-Detail-Request die "rechten" Werte separat.
  // Für jetzt nutzen wir einen Trick: Die Rechten sind in `question.options` als
 2 // zweites Array? Nein, zu komplex.
  //
  // Einfacher Ansatz: Beim Erstellen wird `options` = [left1, left2, ...] und
  // `correct_answer` = {left1: right1, ...}. Der Schüler muss für jede Linke
  // einen Wert aus der Liste der Rechten wählen. Wir zeigen die rechten Werte
  // aber NICHT (das würde die Lösung verraten).
  //
  // Deshalb: Wir zeigen nur die linken Werte + ein Dropdown/Select mit ALLEN
  // rechten Werten (die wir aus correct_answer des Schülers kennen — nein, wir haben sie nicht).
  //
  // PRAKTISCHE LÖSUNG: Der Schüler bekommt die rechten Werte als shuffle-Optionen.
  // Wir müssen sie also beim Quiz-Detail-Request mitsenden (aber NICHT die Zuordnung).
  //
  // Für jetzt: Fallback — wir zeigen nur die linken Items, der Schüler gibt
  // für jedes eine kurze Antwort ein (Text-Input). Das ist weniger elegant,
  // aber funktioniert.
  //
  // TODO: Backend so erweitern, dass es `options` = {left: [...], right: [...]} sendet.

  const currentAnswer = (answer as Record<string, string>) ?? {};

  const handleChange = (left: string, value: string) => {
    if (disabled) return;
    onAnswer({ ...currentAnswer, [left]: value });
  };

  return (
    <div className="space-y-3">
      {leftItems.map((leftItem, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
        >
          <div className="flex-1 font-medium text-sm">{leftItem}</div>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={currentAnswer[leftItem] ?? ""}
            onChange={(e) => handleChange(leftItem, e.target.value)}
            placeholder="Zuordnung..."
            disabled={disabled}
            className="flex-1"
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Schreibe die Zuordnung zu jedem Begriff.
      </p>
    </div>
  );
}
