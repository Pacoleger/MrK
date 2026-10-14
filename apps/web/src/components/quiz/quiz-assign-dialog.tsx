"use client";

import * as React from "react";
import { X, Loader2, Check, Users, User as UserIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { quizzesApi } from "@/lib/quizzes-api";
import { adminApi, type AdminClass, type ClassStudent } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export function QuizAssignDialog({
  quizId,
  quizTitle,
  onClose,
  onSuccess,
}: {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [classes, setClasses] = React.useState<AdminClass[]>([]);
  const [students, setStudents] = React.useState<ClassStudent[]>([]);
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
  const [dueDate, setDueDate] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [studentSearch, setStudentSearch] = React.useState("");

  React.useEffect(() => {
    Promise.all([
      adminApi.classes(),
      adminApi.users({ role: "student" }),
      quizzesApi.assignments(quizId),
    ])
      .then(([classesData, usersData, assignData]) => {
        setClasses(classesData.classes);
        setStudents(
          usersData.users.map((u) => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
          }))
        );
        setSelectedClassIds(assignData.classIds);
        setSelectedStudentIds(assignData.studentIds);
        setDueDate(assignData.dueDate ?? "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [quizId]);

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await quizzesApi.assign(quizId, {
        classIds: selectedClassIds,
        studentIds: selectedStudentIds,
        dueDate: dueDate || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = React.useMemo(() => {
    if (!studentSearch) return students;
    const s = studentSearch.toLowerCase();
    return students.filter(
      (st) =>
        st.first_name.toLowerCase().includes(s) ||
        st.last_name.toLowerCase().includes(s) ||
        st.email.toLowerCase().includes(s)
    );
  }, [students, studentSearch]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">Quiz zuweisen</h2>
            <p className="text-xs text-muted-foreground truncate">{quizTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition shrink-0"
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

          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-500" />
                    Klassen
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedClassIds.length} ausgewählt
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {classes.map((c) => {
                    const active = selectedClassIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClass(c.id)}
                        disabled={isSaving}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition",
                          active
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <span className="flex-1 text-left">{c.name}</span>
                        {active && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-brand-500" />
                    Einzelne Schüler
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedStudentIds.length} ausgewählt
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Schüler suchen..."
                    className="pl-8 h-9 text-sm"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      Keine Schüler gefunden.
                    </p>
                  ) : (
                    filteredStudents.map((s) => {
                      const active = selectedStudentIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleStudent(s.id)}
                          disabled={isSaving}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 text-left transition",
                            active
                              ? "bg-brand-50 dark:bg-brand-900/20"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-[10px] font-bold shrink-0">
                            {(s.first_name.charAt(0) + s.last_name.charAt(0)).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {s.first_name} {s.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {s.email}
                            </p>
                          </div>
                          {active && (
                            <Check className="h-4 w-4 text-brand-600 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Fälligkeitsdatum (optional)</h3>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Zuteilung speichern
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
