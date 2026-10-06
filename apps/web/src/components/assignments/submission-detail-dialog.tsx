"use client";

import * as React from "react";
import {
  X,
  Clock,
  FileText,
  Download,
  Star,
  Loader2,
  Check,
  Award,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { assignmentsApi } from "@/lib/assignments-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SubmissionRow } from "@/lib/assignments-api";

export function SubmissionDetailDialog({
  submission,
  maxPoints,
  onClose,
  onSuccess,
}: {
  submission: SubmissionRow;
  maxPoints: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [points, setPoints] = React.useState(submission.points ?? 0);
  const [feedback, setFeedback] = React.useState(submission.feedback ?? "");
  const [stars, setStars] = React.useState(submission.stars_awarded ?? 0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasSubmission = !!submission.submission_id;
  const canGrade =
    submission.status === "submitted" || submission.status === "graded";

  const handleGrade = async () => {
    if (!submission.submission_id) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await assignmentsApi.grade(submission.submission_id, {
        points,
        maxPoints,
        feedback: feedback.trim() || undefined,
        starsAwarded: stars,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Bewertung fehlgeschlagen"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const percent = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-3xl bg-card rounded-2xl shadow-2xl border border-border max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold">
              {(
                submission.first_name.charAt(0) + submission.last_name.charAt(0)
              ).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {submission.first_name} {submission.last_name}
              </h2>
              <p className="text-xs text-muted-foreground">{submission.email}</p>
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

          {!hasSubmission ? (
            <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Noch keine Abgabe</p>
              <p className="text-xs text-muted-foreground mt-1">
                Der Schüler hat diese Aufgabe noch nicht eingereicht.
              </p>
            </div>
          ) : (
            <>
              {/* Submission Info */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {submission.submitted_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(submission.submitted_at).toLocaleString("de-DE")}
                    </span>
                  )}
                  {submission.time_spent_sec > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(submission.time_spent_sec / 60)} Min
                    </span>
                  )}
                </div>

                {/* Content */}
                {submission.content && (
                  <div>
                    <p className="text-sm font-medium mb-1">Antwort:</p>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                      {submission.content}
                    </div>
                  </div>
                )}

                {/* Uploads */}
                {submission.submission_id && (
                  <SubmissionUploads submissionId={submission.submission_id} />
                )}
              </div>

              {/* Grade Section */}
              {canGrade && (
                <>
                  <div className="border-t border-border pt-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Award className="h-4 w-4 text-brand-500" />
                      Bewertung
                    </h3>

                    {/* Points */}
                    <div className="space-y-2">
                      <Label htmlFor="points">
                        Punkte (max. {maxPoints})
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="points"
                          type="number"
                          min={0}
                          max={maxPoints}
                          value={points}
                          onChange={(e) =>
                            setPoints(
                              Math.min(
                                maxPoints,
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            )
                          }
                          disabled={isSubmitting}
                          className="w-32"
                        />
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              percent >= 90
                                ? "bg-gradient-to-r from-accent-400 to-accent-500"
                                : percent >= 70
                                ? "bg-gradient-to-r from-brand-400 to-brand-500"
                                : percent >= 50
                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                : "bg-gradient-to-r from-red-400 to-red-500"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="space-y-2">
                      <Label>Sterne vergeben</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setStars(n === stars ? 0 : n)}
                            disabled={isSubmitting}
                            className="p-1 transition hover:scale-110"
                          >
                            <Star
                              className={cn(
                                "h-6 w-6",
                                n <= stars
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              )}
                            />
                          </button>
                        ))}
                        {stars > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            +{stars} Sterne
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-2">
                      <Label htmlFor="feedback">Feedback (optional)</Label>
                      <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Anmerkungen für den Schüler..."
                        className="w-full min-h-[100px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-y"
                      />
                    </div>
                  </div>
                </>
              )}

              {!canGrade && hasSubmission && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200">
                  {submission.status === "in_progress"
                    ? "Der Schüler arbeitet noch an dieser Aufgabe."
                    : "Diese Aufgabe kann noch nicht bewertet werden."}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Schließen
          </Button>
          {canGrade && (
            <Button onClick={handleGrade} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {submission.status === "graded"
                    ? "Bewertung aktualisieren"
                    : "Bewerten"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Uploads-Anzeige
// ============================================================

function SubmissionUploads({ submissionId }: { submissionId: string }) {
  const [uploads, setUploads] = React.useState<
    Array<{
      id: string;
      file_name: string;
      file_type: string;
      file_size: number;
      created_at: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    assignmentsApi
      .listUploads(submissionId)
      .then((data) => setUploads(data.uploads))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [submissionId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Dateien werden geladen...
      </div>
    );
  }

  if (uploads.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        Angehängte Dateien ({uploads.length})
      </p>
      <div className="space-y-2">
        {uploads.map((u) => (
          <a
            key={u.id}
            href={`https://mrk-api.pacokamegne.workers.dev/api/uploads/${u.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-brand-400 transition"
          >
            <FileText className="h-4 w-4 text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{u.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {(u.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
