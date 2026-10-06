"use client";

import Link from "next/link";
import { Clock, CheckCircle2, CircleDot, FileText, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Assignment } from "@/lib/assignments-api";

const subjectColors: Record<string, string> = {
  math: "from-brand-500 to-brand-700",
  physics: "from-accent-500 to-accent-700",
  chemistry: "from-brand-600 to-accent-600",
  biology: "from-accent-400 to-brand-500",
};

const statusLabels: Record<string, string> = {
  not_started: "Nicht begonnen",
  in_progress: "In Bearbeitung",
  submitted: "Abgegeben",
  graded: "Bewertet",
};

const typeLabels: Record<string, string> = {
  homework: "Hausaufgabe",
  exercise: "Übung",
  test: "Test",
  quiz: "Quiz",
  project: "Projekt",
};

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const status = assignment.submission_status ?? "not_started";
  const due = assignment.due_date ? new Date(assignment.due_date) : null;
  const now = new Date();
  const isOverdue = due && due < now && status === "not_started";
  const isDueSoon =
    due &&
    !isOverdue &&
    due.getTime() - now.getTime() < 24 * 60 * 60 * 1000 &&
    status === "not_started";

  const colorClass =
    subjectColors[assignment.subject_id] ?? "from-brand-500 to-accent-500";
  const isPersonal = !!assignment.target_student_id;

  return (
    <Link
      href={`/dashboard/aufgaben/detail?id=${assignment.id}`}
      className="block rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition overflow-hidden group"
    >
      <div className={cn("h-1 bg-gradient-to-r", colorClass)} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 flex-wrap">
              <span>
                {assignment.subject_name ?? assignment.subject_id}
                {assignment.class_name && ` · ${assignment.class_name}`}
              </span>
              {isPersonal && (
                <Badge
                  variant="secondary"
                  className="gap-1 text-[10px] font-medium normal-case"
                >
                  <User className="h-2.5 w-2.5" />
                  Nur für dich
                </Badge>
              )}
            </p>
            <h3 className="font-semibold mt-1 truncate group-hover:text-brand-600 transition">
              {assignment.title}
            </h3>
          </div>

          <Badge
            variant={
              status === "graded"
                ? "success"
                : status === "submitted"
                ? "default"
                : isOverdue
                ? "destructive"
                : "outline"
            }
            className="shrink-0 gap-1"
          >
            {status === "graded" && <CheckCircle2 className="h-3 w-3" />}
            {status === "in_progress" && <CircleDot className="h-3 w-3" />}
            {statusLabels[status]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {typeLabels[assignment.type]}
          </span>

          {due && (
            <span
              className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-600 font-medium",
                isDueSoon && "text-amber-600 font-medium"
              )}
            >
              <Clock className="h-3 w-3" />
              {due.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          <span className="ml-auto">{assignment.max_points} P</span>
        </div>
      </div>
    </Link>
  );
}
