"use client";

import * as React from "react";
import {
  GraduationCap,
  Plus,
  Trash2,
  Loader2,
  Users,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi, type AdminClass, type SchoolYear } from "@/lib/admin-api";

export default function AdminClassesPage() {
  const [classes, setClasses] = React.useState<AdminClass[]>([]);
  const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesData, yearsData] = await Promise.all([
        adminApi.classes(),
        adminApi.schoolYears(),
      ]);
      setClasses(classesData.classes);
      setSchoolYears(yearsData.schoolYears);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (classId: string, name: string) => {
    if (!confirm(`Klasse "${name}" wirklich löschen? Alle Zuordnungen werden entfernt.`)) return;
    try {
      await adminApi.deleteClass(classId);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-brand-500" />
            Klassenverwaltung
          </h1>
          <p className="text-sm text-muted-foreground">
            {classes.length} Klassen
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={schoolYears.length === 0}>
          <Plus className="h-4 w-4" />
          Neue Klasse
        </Button>
      </div>

      {schoolYears.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Kein Schuljahr vorhanden. Bitte erst ein Schuljahr anlegen.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white font-bold shrink-0">
                  {c.name}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{c.name}</p>
                    <span className="text-xs text-muted-foreground">
                      Klasse {c.grade_level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.school_year_name ?? "—"}
                    {c.teacher_first && ` · ${c.teacher_first} ${c.teacher_last}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                  <Users className="h-4 w-4" />
                  {c.student_count}
                </div>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateClassDialog
          schoolYears={schoolYears}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateClassDialog({
  schoolYears,
  onClose,
  onSuccess,
}: {
  schoolYears: SchoolYear[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const activeYear = schoolYears.find((y) => y.is_active === 1);
  const [name, setName] = React.useState("");
  const [gradeLevel, setGradeLevel] = React.useState(7);
  const [schoolYearId, setSchoolYearId] = React.useState(
    activeYear?.id ?? schoolYears[0]?.id ?? ""
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError("Name ist erforderlich");
    setIsSubmitting(true);
    try {
      await adminApi.createClass({ name: name.trim(), gradeLevel, schoolYearId });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Neue Klasse</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. 9A"
            />
          </div>
          <div className="space-y-2">
            <Label>Klassenstufe</Label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value))}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm"
            >
              {[5, 6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                <option key={g} value={g}>
                  Klasse {g}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Schuljahr</Label>
            <select
              value={schoolYearId}
              onChange={(e) => setSchoolYearId(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm"
            >
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.is_active ? "(aktiv)" : ""}
                </option>
              ))}
            </select>
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
                Erstellen...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Erstellen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
