"use client";

import * as React from "react";
import { Loader2, X, Plus, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  assignmentsApi,
  classesApi,
  type AssignmentType,
  type StudentInfo,
} from "@/lib/assignments-api";
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
  const [classId, setClassId] = React.useState<string>(
    availableClasses[0]?.id ?? ""
  );
  const [subjectId, setSubjectId] = React.useState("math");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<AssignmentType>("homework");
  const [maxPoints, setMaxPoints] = React.useState(100);
  const [dueDate, setDueDate] = React.useState("");
  const [targetStudentId, setTargetStudentId] = React.useState<string>("");
  const [students, setStudents] = React.useState<StudentInfo[]>([]);
  const [loadingStudents, setLoadingStudents] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Wenn classId leer und availableClasses lädt → erste setzen
  React.useEffect(() => {
    if (!classId && availableClasses.length > 0) {
      setClassId(availableClasses[0].id);
    }
  }, [availableClasses, classId]);

  // Schüler laden bei Klassenwechsel
  React.useEffect(() => {
    if (!classId) {
      setStudents([]);
      setTargetStudentId("");
      return;
    }

    setLoadingStudents(true);
    setTargetStudentId("");
    classesApi
      .students(classId)
      .then((data) => setStudents(data.students))
      .catch((err) => {
        console.error("Schüler laden fehlgeschlagen:", err);
        setStudents([]);
      })
      .finally(() => setLoadingStudents(false));
  }, [classId]);

  const handleSubmit = async () => {
    setError(null);

    if (!classId) {
      return setError("Bitte wähle eine Klasse aus");
    }
    if (!title.trim()) {
      return setError("Titel ist erforderlich");
    }

    console.log("[AssignmentDialog] submit payload:", {
      classId,
      subjectId,
      title,
      type,
      maxPoints,
      targetStudentId: targetStudentId || null,
    });

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
        targetStudentId: targetStudentId || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erstellen fehlgeschlagen"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPersonal = !!targetStudentId;

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
              <Label htmlFor="classId">Klasse</Label>
              <select
                id="classId"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={isSubmitting || availableClasses.length === 0}
                className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                {availableClasses.length === 0 && (
                  <option value="">Lade Klassen...</option>
                )}
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectId">Fach</Label>
              <select
                id="subjectId"
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

          {/* Empfänger-Auswahl */}
          <div className="space-y-2">
            <Label>Für wen?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetStudentId("")}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition",
                  !isPersonal
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500"
                    : "border-border hover:bg-muted"
                )}
              >
                <Users className="h-4 w-4" />
                Ganze Klasse
              </button>
              <button
                type="button"
                onClick={() => {
                  if (students.length === 0) return;
                  setTargetStudentId(students[0].id);
                }}
                disabled={isSubmitting || students.length === 0 || loadingStudents}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition",
                  isPersonal
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500"
                    : "border-border hover:bg-muted",
                  (students.length === 0 || loadingStudents) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                <User className="h-4 w-4" />
                Einzelner Schüler
              </button>
            </div>
          </div>

          {/* Schüler-Dropdown (nur wenn Einzelaufgabe) */}
          {isPersonal && (
            <div className="space-y-2">
              <Label htmlFor="targetStudent">Schüler auswählen</Label>
              {loadingStudents ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Lade Schüler...
                </div>
              ) : (
                <select
                  id="targetStudent"
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.email})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground">
                Nur dieser Schüler sieht die Aufgabe.
              </p>
            </div>
          )}

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
              disabled={isSubmitting}
              placeholder="Aufgabenstellung, Hinweise..."
              className="w-full min-h-[100px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label>Typ</Label>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  disabled={isSubmitting}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition",
                    type === t.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="points">Max. Punkte</Label>
              <Input
                id="points"
                type="number"
                min={1}
                max={1000}
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due">Abgabefrist (optional)</Label>
              <Input
                id="due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !classId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Erstellen...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Aufgabe erstellen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
