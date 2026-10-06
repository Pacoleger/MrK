"use client";

import * as React from "react";
import {
  Trash2,
  Plus,
  X,
  ListChecks,
  CheckCircle2,
  Type,
  Underline,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  QUESTION_TYPE_LABELS,
  type QuizQuestionDraft,
  type QuestionType,
} from "@/lib/quiz-types";

const QUESTION_TYPES: {
  value: QuestionType;
  icon: typeof ListChecks;
}[] = [
  { value: "multiple_choice", icon: ListChecks },
  { value: "true_false", icon: CheckCircle2 },
  { value: "short_answer", icon: Type },
  { value: "fill_blank", icon: Underline },
  { value: "matching", icon: ArrowLeftRight },
];

function makeDraft(type: QuestionType): QuizQuestionDraft {
  const base: QuizQuestionDraft = {
    id: crypto.randomUUID(),
    type,
    question: "",
    points: 1,
  };

  switch (type) {
    case "multiple_choice":
      return { ...base, options: ["", "", "", ""], correctIndex: 0 };
    case "true_false":
      return { ...base, options: ["Wahr", "Falsch"], correctIndex: 0 };
    case "short_answer":
      return { ...base, acceptedAnswers: [""] };
    case "fill_blank":
      return { ...base, acceptedAnswers: ["", ""] };
    case "matching":
      return {
        ...base,
        pairs: [
          { left: "", right: "" },
          { left: "", right: "" },
        ],
      };
  }
}

export function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: QuizQuestionDraft;
  index: number;
  total: number;
  onChange: (updated: QuizQuestionDraft) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  const update = <K extends keyof QuizQuestionDraft>(
    key: K,
    value: QuizQuestionDraft[K]
  ) => {
    onChange({ ...question, [key]: value });
  };

  const Icon =
    QUESTION_TYPES.find((t) => t.value === question.type)?.icon ?? ListChecks;

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="p-1 rounded hover:bg-muted"
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>

        <div className="w-7 h-7 rounded-lg bg-brand-500 text-white grid place-items-center text-xs font-bold shrink-0">
          {index + 1}
        </div>

        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />

        <Badge variant="secondary" className="shrink-0">
          {QUESTION_TYPE_LABELS[question.type]}
        </Badge>

        <span className="text-sm text-muted-foreground truncate flex-1">
          {question.question || "(leer)"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Frage */}
          <div className="space-y-2">
            <Label>Frage</Label>
            <textarea
              value={question.question}
              onChange={(e) => update("question", e.target.value)}
              placeholder="Formuliere die Frage..."
              className="w-full min-h-[60px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-y"
            />
          </div>

          {/* Typ-spezifischer Editor */}
          <QuestionTypeFields question={question} onChange={onChange} />

          {/* Punkte + Erklärung */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Punkte</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={question.points}
                onChange={(e) =>
                  update("points", Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Erklärung (optional)</Label>
            <Input
              value={question.explanation ?? ""}
              onChange={(e) => update("explanation", e.target.value)}
              placeholder="Wird nach der Auswertung angezeigt..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Typ-spezifische Felder
// ============================================================

function QuestionTypeFields({
  question,
  onChange,
}: {
  question: QuizQuestionDraft;
  onChange: (q: QuizQuestionDraft) => void;
}) {
  switch (question.type) {
    case "multiple_choice":
      return <MultipleChoiceFields question={question} onChange={onChange} />;
    case "true_false":
      return <TrueFalseFields question={question} onChange={onChange} />;
    case "short_answer":
      return <ShortAnswerFields question={question} onChange={onChange} />;
    case "fill_blank":
      return <FillBlankFields question={question} onChange={onChange} />;
    case "matching":
      return <MatchingFields question={question} onChange={onChange} />;
  }
}

function MultipleChoiceFields({
  question,
  onChange,
}: {
  question: QuizQuestionDraft;
  onChange: (q: QuizQuestionDraft) => void;
}) {
  const options = question.options ?? [];

  const updateOption = (i: number, value: string) => {
    const next = [...options];
    next[i] = value;
    onChange({ ...question, options: next });
  };

  const addOption = () => {
    onChange({ ...question, options: [...options, ""] });
  };

  const removeOption = (i: number) => {
    const next = options.filter((_, idx) => idx !== i);
    let correctIndex = question.correctIndex ?? 0;
    if (correctIndex >= next.length) correctIndex = 0;
    onChange({ ...question, options: next, correctIndex });
  };

  return (
    <div className="space-y-2">
      <Label>Antwortmöglichkeiten (richtige markieren)</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...question, correctIndex: i })}
            className={cn(
              "w-6 h-6 rounded-full grid place-items-center shrink-0 transition",
              question.correctIndex === i
                ? "bg-accent-500 text-white"
                : "border-2 border-border hover:border-accent-400"
            )}
          >
            {question.correctIndex === i && <CheckCircle2 className="h-4 w-4" />}
          </button>
          <Input
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(i)}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="h-4 w-4" />
          Option hinzufügen
        </Button>
      )}
    </div>
  );
}

function TrueFalseFields({
  question,
  onChange,
}: {
  question: QuizQuestionDraft;
  onChange: (q: QuizQuestionDraft) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Richtige Antwort</Label>
      <div className="flex gap-2">
        {["Wahr", "Falsch"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange({ ...question, correctIndex: i })}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg border-2 transition text-sm font-medium",
              question.correctIndex === i
                ? "border-accent-500 bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300"
                : "border-border hover:border-accent-400"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ShortAnswerFields({
  question,
  onChange,
}: {
  question: QuizQuestionDraft;
  onChange: (q: QuizQuestionDraft) => void;
}) {
  const answer = question.acceptedAnswers?.[0] ?? "";

  return (
    <div className="space-y-2">
      <Label>Erwartete Antwort</Label>
      <Input
        value={answer}
        onChange={(e) =>
          onChange({ ...question, acceptedAnswers: [e.target.value] })
        }
        placeholder="Die richtige Antwort..."
      />
      <p className="text-xs text-muted-foreground">
        Groß-/Kleinschreibung und Umlaute werden ignoriert.
      </p>
    </div>
  );
}

function FillBlankFields({
  question,
  onChange,
}: {
  question: QuizQuestionDraft;
  onChange: (q: QuizQuestionDraft) => void;
}) {
  const answers = question.acceptedAnswers ?? ["", ""];

  const updateAnswer = (i: number, value: string) => {
    const next = [...answers];
    next[i] = value;
    onChange({ ...question, acceptedAnswers: next });
  };

  return (
    <div className="space-y-2">
      <Label>Akzeptierte Antworten (mind. 1)</Label>
      {answers.map((ans, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={ans}
            onChange={(e) => updateAnswer(i, e.target.value)}
            placeholder={`Antwort ${i + 1}`}
          />
          {answers.length > 1 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...question,
                  acceptedAnswers: answers.filter((_, idx) => idx !== i),
                })
              }
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({ ...question, acceptedAnswers: [...answers, ""] })
        }
      >
        <Plus className="h-4 w-4" />
        Alternative Antwort
      </Button>
    </div>
  );
}

function MatchingFields({
  question,
  onChange,
}: {
  question: QuizQuestionDraft;
  onChange: (q: QuizQuestionDraft) => void;
}) {
  const pairs = question.pairs ?? [];

  const updatePair = (i: number, key: "left" | "right", value: string) => {
    const next = [...pairs];
    next[i] = { ...next[i], [key]: value };
    onChange({ ...question, pairs: next });
  };

  return (
    <div className="space-y-2">
      <Label>Paare zuordnen</Label>
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={pair.left}
            onChange={(e) => updatePair(i, "left", e.target.value)}
            placeholder="Links"
          />
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={pair.right}
            onChange={(e) => updatePair(i, "right", e.target.value)}
            placeholder="Rechts"
          />
          {pairs.length > 2 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...question,
                  pairs: pairs.filter((_, idx) => idx !== i),
                })
              }
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            ...question,
            pairs: [...pairs, { left: "", right: "" }],
          })
        }
      >
        <Plus className="h-4 w-4" />
        Paar hinzufügen
      </Button>
    </div>
  );
}

export { makeDraft, QUESTION_TYPES };
