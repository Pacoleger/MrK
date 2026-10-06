"use client";

import * as React from "react";
import {
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  CircleDot,
  Loader2,
  Eye,
  Award,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubmissionRow } from "@/lib/assignments-api";

type StatusFilter = "all" | "not_started" | "in_progress" | "submitted" | "graded";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Nicht begonnen",
  in_progress: "In Bearbeitung",
  submitted: "Abgegeben",
  graded: "Bewertet",
};

export function SubmissionsList({
  submissions,
  onSelect,
}: {
  submissions: SubmissionRow[];
  onSelect: (sub: SubmissionRow) => void;
}) {
  const [filter, setFilter] = React.useState<StatusFilter>("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return submissions;
    return submissions.filter((s) => s.status === filter);
  }, [submissions, filter]);

  const stats = React.useMemo(() => {
    const s = {
      all: submissions.length,
      not_started: 0,
      in_progress: 0,
      submitted: 0,
      graded: 0,
    };
    for (const sub of submissions) {
      if (sub.status === "not_started") s.not_started++;
      else if (sub.status === "in_progress") s.in_progress++;
      else if (sub.status === "submitted") s.submitted++;
      else if (sub.status === "graded") s.graded++;
    }
    return s;
  }, [submissions]);

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "not_started", label: "Offen" },
    { value: "in_progress", label: "In Arbeit" },
    { value: "submitted", label: "Abgegeben" },
    { value: "graded", label: "Bewertet" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2",
              filter === f.value
                ? "bg-brand-500 text-white"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            )}
          >
            {f.label}
            <span
              className={cn(
                "text-xs px-1.5 rounded-full",
                filter === f.value ? "bg-white/20" : "bg-background/50"
              )}
            >
              {stats[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Keine Einträge in dieser Kategorie.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((sub) => (
            <SubmissionRowItem
              key={sub.student_id}
              submission={sub}
              onClick={() => onSelect(sub)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionRowItem({
  submission,
  onClick,
}: {
  submission: SubmissionRow;
  onClick: () => void;
}) {
  const status = submission.status;
  const isSubmitted = status === "submitted" || status === "graded";

  const initials = (
    submission.first_name.charAt(0) + submission.last_name.charAt(0)
  ).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card hover:border-brand-400 hover:shadow-md transition p-4"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {submission.first_name} {submission.last_name}
            </p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {submission.email}
          </p>

          {isSubmitted && submission.submitted_at && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Abgegeben am{" "}
              {new Date(submission.submitted_at).toLocaleString("de-DE", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {submission.time_spent_sec > 0 && (
                <>
                  {" · "}
                  {Math.floor(submission.time_spent_sec / 60)} Min
                </>
              )}
            </p>
          )}
        </div>

        {/* Bewertung oder "Öffnen" */}
        {status === "graded" && submission.points !== null ? (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold">
              {submission.points}
              <span className="text-xs text-muted-foreground">
                /{submission.max_points}
              </span>
            </p>
            {submission.stars_awarded && submission.stars_awarded > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-0.5 justify-end">
                <Award className="h-3 w-3" />
                {submission.stars_awarded}
              </p>
            )}
          </div>
        ) : isSubmitted ? (
          <Badge variant="outline" className="gap-1 shrink-0">
            <Eye className="h-3 w-3" />
            Prüfen
          </Badge>
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "graded") {
    return (
      <Badge variant="success" className="gap-1 shrink-0">
        <CheckCircle2 className="h-3 w-3" />
        Bewertet
      </Badge>
    );
  }
  if (status === "submitted") {
    return (
      <Badge variant="default" className="gap-1 shrink-0">
        <FileText className="h-3 w-3" />
        Abgegeben
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge variant="secondary" className="gap-1 shrink-0">
        <CircleDot className="h-3 w-3" />
        In Arbeit
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 shrink-0">
      <XCircle className="h-3 w-3" />
      Offen
    </Badge>
  );
}
