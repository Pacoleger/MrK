"use client";

import * as React from "react";
import { Plus, Filter, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { AssignmentDialog } from "@/components/assignments/assignment-dialog";
import { assignmentsApi, type Assignment } from "@/lib/assignments-api";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ClassInfo {
  id: string;
  name: string;
  grade_level: number;
}

const filters = [
  { value: "all", label: "Alle" },
  { value: "open", label: "Offen" },
  { value: "submitted", label: "Abgegeben" },
  { value: "graded", label: "Bewertet" },
] as const;

export default function AufgabenPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [availableClasses, setAvailableClasses] = React.useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<string>("all");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const loadAssignments = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { assignments } = await assignmentsApi.list();
      setAssignments(assignments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Klassen laden (nur für Lehrer)
  React.useEffect(() => {
    if (!isTeacher) return;
    apiGet<{ classes: ClassInfo[] }>("/api/classes")
      .then((data) => setAvailableClasses(data.classes))
      .catch((err) => console.error("Klassen laden fehlgeschlagen:", err));
  }, [isTeacher]);

  React.useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const filtered = React.useMemo(() => {
    if (activeFilter === "all") return assignments;
    if (activeFilter === "open") {
      return assignments.filter(
        (a) =>
          !a.submission_status ||
          a.submission_status === "not_started" ||
          a.submission_status === "in_progress"
      );
    }
    if (activeFilter === "submitted") {
      return assignments.filter((a) => a.submission_status === "submitted");
    }
    if (activeFilter === "graded") {
      return assignments.filter((a) => a.submission_status === "graded");
    }
    return assignments;
  }, [assignments, activeFilter]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aufgaben</h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? "Erstelle und verwalte Aufgaben für deine Klassen."
              : "Deine aktuellen Aufgaben im Überblick."}
          </p>
        </div>

        {isTeacher && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={availableClasses.length === 0}
          >
            <Plus className="h-4 w-4" />
            Neue Aufgabe
          </Button>
        )}
      </div>

      {isTeacher && availableClasses.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-sm text-amber-900 dark:text-amber-200">
          Du bist noch keiner Klasse als Lehrer zugewiesen. Bitte wende dich an
          den Administrator.
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition",
              activeFilter === f.value
                ? "bg-brand-500 text-white"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 text-sm text-red-900 dark:text-red-200">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">Keine Aufgaben</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher
              ? "Erstelle deine erste Aufgabe."
              : "Aktuell sind keine Aufgaben vorhanden."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}

      {showCreateDialog && (
        <AssignmentDialog
          availableClasses={availableClasses}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadAssignments();
          }}
        />
      )}
    </div>
  );
}
