"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Users,
  GraduationCap,
  Loader2,
  X,
  Search,
  UserCog,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  adminApi,
  type ClassDetail,
  type ClassStudent,
  type Teacher,
} from "@/lib/admin-api";

export default function ClassDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classId = params.id;

  const [detail, setDetail] = React.useState<ClassDetail | null>(null);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = React.useState(false);
  const [showChangeTeacher, setShowChangeTeacher] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detailData, teachersData] = await Promise.all([
        adminApi.classDetail(classId),
        adminApi.teachers(),
      ]);
      setDetail(detailData);
      setTeachers(teachersData.teachers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleRemoveStudent = async (student: ClassStudent) => {
    if (
      !confirm(
        `${student.first_name} ${student.last_name} aus der Klasse entfernen?`
      )
    )
      return;

    try {
      await adminApi.removeStudentFromClass(classId, student.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler");
    }
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link
          href="/dashboard/admin/klassen"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <Alert variant="destructive">
          <AlertDescription>{error ?? "Klasse nicht gefunden"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { class: cls, students, subjects } = detail;

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/dashboard/admin/klassen"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Klassen
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white font-bold text-xl">
              {cls.name}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{cls.name}</h1>
              <p className="text-sm text-muted-foreground">
                Klasse {cls.grade_level} · {cls.school_year_name ?? "—"}
              </p>
            </div>
            <Badge variant="outline" className="gap-1 shrink-0">
              <Users className="h-3 w-3" />
              {students.length} Schüler
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Klassenlehrer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Klassenlehrer:in
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChangeTeacher(true)}
          >
            Ändern
          </Button>
        </CardHeader>
        <CardContent>
          {cls.teacher_first ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold">
                {(
                  cls.teacher_first.charAt(0) + (cls.teacher_last?.charAt(0) ?? "")
                ).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  {cls.teacher_first} {cls.teacher_last}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Kein Klassenlehrer zugewiesen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Schüler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Schüler ({students.length})
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddStudent(true)}>
            <UserPlus className="h-4 w-4" />
            Schüler hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Noch keine Schüler in dieser Klasse.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const initials = (
                  student.first_name.charAt(0) + student.last_name.charAt(0)
                ).toUpperCase();
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition"
                      title="Aus Klasse entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fächer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Fächer ({subjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Fächer zugewiesen.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  className="p-3 rounded-lg border border-border"
                >
                  <p className="font-medium text-sm">{subj.subject_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {subj.teacher_first
                      ? `${subj.teacher_first} ${subj.teacher_last}`
                      : "Kein Lehrer"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddStudent && (
        <AddStudentModal
          classId={classId}
          onClose={() => setShowAddStudent(false)}
          onSuccess={() => {
            setShowAddStudent(false);
            load();
          }}
        />
      )}

      {showChangeTeacher && (
        <ChangeTeacherModal
          classId={classId}
          currentTeacherId={cls.homeroom_teacher_id}
          teachers={teachers}
          onClose={() => setShowChangeTeacher(false)}
          onSuccess={() => {
            setShowChangeTeacher(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// AddStudentModal
// ============================================================

function AddStudentModal({
  classId,
  onClose,
  onSuccess,
}: {
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [students, setStudents] = React.useState<ClassStudent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [isAdding, setIsAdding] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    adminApi
      .availableStudents(classId)
      .then((data) => setStudents(data.students))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [classId]);

  const filtered = React.useMemo(() => {
    if (!search) return students;
    const s = search.toLowerCase();
    return students.filter(
      (st) =>
        st.first_name.toLowerCase().includes(s) ||
        st.last_name.toLowerCase().includes(s) ||
        st.email.toLowerCase().includes(s)
    );
  }, [students, search]);

  const handleAdd = async (studentId: string) => {
    setIsAdding(studentId);
    setError(null);
    try {
      await adminApi.addStudentToClass(classId, studentId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand-500" />
            Schüler hinzufügen
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name oder E-Mail suchen..."
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-3">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Keine Treffer."
                  : "Alle Schüler sind bereits in Klassen."}
              </p>
            </div>
          ) : (
            filtered.map((student) => {
              const initials = (
                student.first_name.charAt(0) + student.last_name.charAt(0)
              ).toUpperCase();
              return (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 border-b border-border last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(student.id)}
                    disabled={isAdding === student.id}
                  >
                    {isAdding === student.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3" />
                    )}
                    Hinzufügen
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ChangeTeacherModal
// ============================================================

function ChangeTeacherModal({
  classId,
  currentTeacherId,
  teachers,
  onClose,
  onSuccess,
}: {
  classId: string;
  currentTeacherId: string | null;
  teachers: Teacher[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedId, setSelectedId] = React.useState<string>(
    currentTeacherId ?? ""
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await adminApi.setHomeroomTeacher(classId, selectedId || null);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Klassenlehrer:in ändern</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={isSaving}
            className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Kein Lehrer</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name} ({t.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              "Speichern"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
