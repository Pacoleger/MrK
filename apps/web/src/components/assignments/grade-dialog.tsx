"use client";

import * as React from "react";
import { Loader2, X, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assignmentsApi } from "@/lib/assignments-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function GradeDialog({
  submissionId,
  maxPoints,
  studentName,
  onClose,
  onSuccess,
}: {
  submissionId: string;
  maxPoints: number;
  studentName?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [points, setPoints] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");
  const [stars, setStars] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await assignmentsApi.grade(submissionId, {
        points,
        maxPoints,
        feedback,
        starsAwarded: stars,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bewertung fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const percent = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Bewertung</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {studentName && (
            <p className="text-sm text-muted-foreground">
              Schüler:in: <strong>{studentName}</strong>
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="points">Punkte (max. {maxPoints})</Label>
            <div className="flex items-center gap-3">
              <Input
                id="points"
                type="number"
                min={0}
                max={maxPoints}
                value={points}
                onChange={(e) =>
                  setPoints(Math.min(maxPoints, Math.max(0, Number(e.target.value))))
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
                {Math.round(percent)}%
              </span>
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isSubmitting}
              placeholder="Anmerkungen für die Schüler:in..."
              className="w-full min-h-[100px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-y"
            />
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
                Speichern...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Bewertung speichern
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
