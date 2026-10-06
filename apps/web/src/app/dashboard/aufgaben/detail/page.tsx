"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Clock,
  FileText,
  Send,
  CheckCircle2,
  Play,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionDialog } from "@/components/assignments/submission-dialog";
import { SubmissionsList } from "@/components/assignments/submissions-list";
import { SubmissionDetailDialog } from "@/components/assignments/submission-detail-dialog";
import {
  assignmentsApi,
  type Assignment,
  type Submission,
  type SubmissionRow,
} from "@/lib/assignments-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

function AssignmentDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { user } = useAuth();

  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    React.useState<SubmissionRow | null>(null);

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const load = React.useCallback(async () => {
    if (!id) {
      setError("Keine Aufgabe ausgewählt");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await assignmentsApi.detail(id);
      setAssignment(data.assignment);
      setSubmission(data.submission ?? null);

      // Lehrer: zusätzlich alle Abgaben laden
      if (isTeacher) {
        try {
          const subData = await assignmentsApi.submissions(id);
          setSubmissions(subData.submissions);
        } catch (err) {
          console.warn("Submissions konnten nicht geladen werden:", err);
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  }, [id, isTeacher]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (isStudent && submission?.status === "not_started" && assignment) {
      assignmentsApi
        .start(assignment.id)
        .then(({ submission }) => setSubmission(submission))
        .catch(console.error);
    }
  }, [isStudent, submission?.status, assignment]);

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
    <div className="max-w-5xl space-y-6">
      <Link
        href="/dashboard/aufgaben"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Aufgaben
      </Link>

      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {assignment.subject_name ?? assignment.subject_id}
                {assignment.class_name && ` · ${assignment.class_name}`}
              </p>
              <CardTitle className="mt-2 text-2xl">
                {assignment.title}
              </CardTitle>
            </div>
            {isStudent && (
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
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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
          </div>

          {assignment.description && (
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          )}

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

      {/* Lehrer: Abgaben-Liste */}
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" />
              Abgaben ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Noch keine Schüler in dieser Klasse.
                </p>
              </div>
            ) : (
              <SubmissionsList
                submissions={submissions}
                onSelect={setSelectedSubmission}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialoge */}
      {showSubmitDialog && submission && (
        <SubmissionDialog
          submission={submission}
          onClose={() => setShowSubmitDialog(false)}
          onSuccess={() => {
            setShowSubmitDialog(false);
            load();
          }}
        />
      )}

      {selectedSubmission && assignment && (
        <SubmissionDetailDialog
          submission={selectedSubmission}
          maxPoints={assignment.max_points}
          onClose={() => setSelectedSubmission(null)}
          onSuccess={() => {
            setSelectedSubmission(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function AssignmentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AssignmentDetailContent />
    </Suspense>
  );
}
