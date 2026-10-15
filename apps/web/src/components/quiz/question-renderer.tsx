"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Circle } from "lucide-react";
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
  // options kann Array sein ODER (theoretisch) JSON-String
  let options: string[] = [];
  if (Array.isArray(question.options)) {
    options = question.options as string[];
  } else if (typeof question.options === "string") {
    try {
      const parsed = JSON.parse(question.options);
      if (Array.isArray(parsed)) options = parsed;
    } catch {
      options = [];
    }
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        (Diese Frage hat keine Antwortoptionen.)
      </p>
    );
  }

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
  let options: string[] = ["Wahr", "Falsch"];
  if (Array.isArray(question.options) && question.options.length === 2) {
    options = question.options as string[];
  }

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
        Groß-/Kleinschreibung und Umlaute werden nicht unterschieden.
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
  // options kann sein:
  //  - { left: [...], right: [...] }   ← neue Form (mit Dropdowns)
  //  - string[]                          ← alte Form (Fallback: nur linke Werte)
  let leftItems: string[] = [];
  let rightItems: string[] = [];

  const opts = question.options as unknown;
  if (opts && typeof opts === "object" && !Array.isArray(opts)) {
    const o = opts as { left?: string[]; right?: string[] };
    leftItems = Array.isArray(o.left) ? o.left : [];
    rightItems = Array.isArray(o.right) ? o.right : [];
  } else if (Array.isArray(opts)) {
    leftItems = opts as string[];
    rightItems = [];
  }

  const currentAnswer = (answer as Record<string, string>) ?? {};

  const handleChange = (left: string, value: string) => {
    if (disabled) return;
    onAnswer({ ...currentAnswer, [left]: value });
  };

  if (leftItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        (Diese Zuordnungs-Frage hat keine Elemente.)
      </p>
    );
  }

  // Wenn rechte Werte fehlen → Fallback: Text-Input
  if (rightItems.length === 0) {
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

  // Volle Matching-Ansicht mit Dropdown
  return (
    <div className="space-y-3">
      {leftItems.map((leftItem, i) => {
        const selected = currentAnswer[leftItem] ?? "";
        return (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border border-border bg-muted/20"
          >
            <div className="flex-1 font-medium text-sm">{leftItem}</div>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <select
              value={selected}
              onChange={(e) => handleChange(leftItem, e.target.value)}
              disabled={disabled}
              className={cn(
                "flex-1 h-10 rounded-lg border-2 bg-card px-3 text-sm transition",
                selected
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-border",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              <option value="">– auswählen –</option>
              {rightItems.map((right, ri) => (
                <option key={ri} value={right}>
                  {right}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Wähle für jeden Begriff die passende Zuordnung.
      </p>
    </div>
  );
}
