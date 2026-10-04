"use client";

import * as React from "react";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadZone } from "./upload-zone";
import { assignmentsApi, type Submission } from "@/lib/assignments-api";
import { ApiError } from "@/lib/api";

export function SubmissionDialog({
  submission,
  onClose,
  onSuccess,
}: {
  submission: Submission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [content, setContent] = React.useState(submission.content ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await assignmentsApi.submit(submission.id, {
        content,
        timeSpentSec: submission.time_spent_sec,
      });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Abgabe fehlgeschlagen");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Aufgabe abgeben</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Deine Antwort</label>
            <textarea
              className="w-full min-h-[140px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-y"
              placeholder="Schreibe hier deine Lösung oder Notizen..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dateien anhängen</label>
            <UploadZone submissionId={submission.id} disabled={isSubmitting} />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>Bearbeitungszeit:</strong>{" "}
              {Math.floor(submission.time_spent_sec / 60)} Min
            </p>
            <p className="mt-1">
              Nach dem Abgeben kannst du die Aufgabe nicht mehr bearbeiten.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird abgegeben...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Jetzt abgeben
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
