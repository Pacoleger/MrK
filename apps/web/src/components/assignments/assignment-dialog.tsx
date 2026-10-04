"use client";

import * as React from "react";
import { Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assignmentsApi, type AssignmentType } from "@/lib/assignments-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const subjects = [
  { id: "math", label: "Mathematik" },
  { id: "physics", label: "Physik" },
  { id: "chemistry", label: "Chemie" },
  { id: "biology", label: "Biologie" },
];

const types: { value: AssignmentType; label: string }[] = [
  { value: "homework", label: "Hausaufgabe" },
  { value: "exercise", label: "Übung" },
  { value: "test", label: "Test" },
  { value: "quiz", label: "Quiz" },
  { value: "project", label: "Projekt" },
];

export function AssignmentDialog({
  onClose,
  onSuccess,
  availableClasses,
}: {
  onClose: () => void;
  onSuccess: () => void;
  availableClasses: Array<{ id: string; name: string }>;
}) {
  const [classId, setClassId] = React.useState(availableClasses[0]?.id ?? "");
  const [subjectId, setSubjectId] = React.useState("math");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<AssignmentType>("homework");
  const [maxPoints, setMaxPoints] = React.useState(100);
  const [dueDate, setDueDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) return setError("Titel ist erforderlich");
    if (!classId) return setError("Klasse ist erforderlich");

    setIsSubmitting(true);
    try {
      await assignmentsApi.create({
        classId,
        subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        maxPoints,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erstellen fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-xl bg-card rounded-2xl shadow-2xl border border-border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Neue Aufgabe</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Klasse</Label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={isSubmitting || availableClasses.length === 0}
                className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                {availableClasses.length === 0 && (
                  <option value="">Keine Klasse zugewiesen</option>
                )}
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Fach</Label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder="z.B. Quadratische Funktionen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Beschreibung (optional)</Label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
             
