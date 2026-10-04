"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Clock,
  FileText,
  Send,
  CheckCircle2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionDialog } from "@/components/assignments/submission-dialog";
import {
  assignmentsApi,
  type Assignment,
  type Submission,
} from "@/lib/assignments-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);

  // Timer
  const [seconds, setSeconds] = React.useState(0);

  const isStudent = user?.role === "student";

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assignmentsApi.detail(id);
      setAssignment(data.assignment);
      setSubmission(data.submission ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Aufgabe automatisch starten, wenn nicht gestartet
  React.useEffect(() => {
    if (isStudent && submission?.status === "not_started" && assignment) {
      assignmentsApi.start(assignment.id).then(({ submission }) => {
        setSubmission(submission);
      }).catch(console.error);
    }
  }, [isStudent, submission?.status, assignment]);

  // Heartbeat alle 30 Sekunden
  React.useEffect(() => {
    if (!isStudent || !submission || submission.status !== "in_progress") return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 30);
      assignmentsApi
        .heartbeat(submission.id, 30)
        .catch((err) => console.error("Heartbeat failed:", err));
    }, 30_000);

    return () => clearInterval(interval);
  }, [isStudent, submission]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/aufgaben"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-900 dark:text-red-200">
          {error ?? "Aufgabe nicht gefunden"}
        </div>
      </div>
    );
  }

  const status = submission?.status ?? "not_started";

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/dashboard/aufgaben"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Aufgaben
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {assignment.subject_name ?? assignment.subject_id}
                {assignment.class_name && ` · ${assignment.class_name}`}
              </p>
              <CardTitle className="mt-2 text-2xl">{assignment.title}</CardTitle>
            </div>
            <Badge
              variant={
                status === "graded"
                  ? "success"
                  : status === "submitted"
                  ? "default"
                  : "outline"
              }
              className="gap-1"
            >
              {status === "graded" && <CheckCircle2 className="h-3 w-3" />}
              {status === "in_progress" && <Play className="h-3 w-3" />}
              {status === "not_started" && "Nicht begonnen"}
              {status === "in_progress" && "In Bearbeitung"}
              {status === "submitted" && "Abgegeben"}
              {status === "graded" && "Bewertet"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {assignment.max_points} Punkte
            </span>
            {assignment.due_date && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Abgabe bis{" "}
                {new Date(assignment.due_date).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {assignment.teacher_first && (
              <span>
                von {assignment.teacher_first} {assignment.teacher_last}
              </span>
            )}
          </div>

          {/* Beschreibung */}
          {assignment.description && (
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {/* Submission Content */}
          {isStudent && submission && (
            <div className="space-y-3">
              {submission.status === "in_progress" && (
                <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-4">
                  <div className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-300">
                    <Play className="h-4 w-4" />
                    <span className="font-medium">Timer läuft</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor(submission.time_spent_sec / 60)} Min bisher
                  </p>
                </div>
              )}

              {submission.status === "submitted" && (
                <div className="rounded-xl bg-accent-50 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 p-4">
                  <div className="flex items-center gap-2 text-sm text-accent-800 dark:text-accent-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Abgegeben</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    am{" "}
                    {submission.submitted_at &&
                      new Date(submission.submitted_at).toLocaleString("de-DE")}
                  </p>
                </div>
              )}

              {submission.content && (
                <div>
                  <p className="text-sm font-medium mb-1">Deine Antwort:</p>
                  <div className="rounded-lg border border-border bg-card p-3 text-sm whitespace-pre-wrap">
                    {submission.content}
                  </div>
                </div>
              )}

              {(submission.status === "in_progress" ||
                submission.status === "not_started") && (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  size="lg"
                  className="w-full"
                >
                  <Send className="h-4 w-4" />
                  Aufgabe abgeben
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showSubmitDialog && submission && (
        <SubmissionDialog
          submission={submission}
          onClose={() => setShowSubmitDialog(false)}
          onSuccess={() => {
            setShowSubmitDialog(false);
            load();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
