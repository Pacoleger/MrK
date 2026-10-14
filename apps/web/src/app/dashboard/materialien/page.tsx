"use client";

import * as React from "react";
import {
  BookOpen,
  Plus,
  Loader2,
  Inbox,
  Filter,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/materials/material-card";
import { MaterialUploadDialog } from "@/components/materials/material-upload-dialog";
import { MaterialViewer } from "@/components/materials/material-viewer";
import { AccessDialog } from "@/components/materials/access-dialog";
import {
  materialsApi,
  SUBJECT_LABELS,
  SUBJECT_ICONS,
  type Material,
  type SubjectOption,
} from "@/lib/materials-api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================
// Typ-Sortierung (Merkblätter → Übungen → Tests)
// ============================================================

type GroupType = "merkblatt" | "uebung" | "test" | "other";

const TYPE_META: Record<
  GroupType,
  { label: string; singular: string; icon: typeof FileText; color: string }
> = {
  merkblatt: {
    label: "Merkblätter",
    singular: "Merkblatt",
    icon: FileText,
    color: "from-brand-500 to-brand-600",
  },
  uebung: {
    label: "Übungen",
    singular: "Übung",
    icon: Pencil,
    color: "from-accent-500 to-accent-600",
  },
  test: {
    label: "Tests",
    singular: "Test",
    icon: FlaskConical,
    color: "from-red-500 to-orange-500",
  },
  other: {
    label: "Sonstiges",
    singular: "Material",
    icon: BookOpen,
    color: "from-slate-500 to-slate-600",
  },
};

const TYPE_ORDER: GroupType[] = ["merkblatt", "uebung", "test", "other"];

/**
 * Erkennt den Typ eines Materials anhand des Titels.
 * Nutzt Emojis + Schlüsselwörter.
 */
function detectMaterialType(m: Material): GroupType {
  const title = m.title.toLowerCase();

  // Emojis zuerst (eindeutig)
  if (title.includes("🧪")) return "test";
  if (title.includes("✏️")) return "uebung";
  if (
    title.includes("📝") ||
    title.includes("📄") ||
    title.includes("📊") ||   // 📊 = Merkblatt (nicht Test!)
    title.includes("📖")
  ) {
    return "merkblatt";
  }

  // Schlüsselwörter (Fallback)
  if (title.includes("merkblatt") || title.includes("übersicht") || title.includes("zusammenfassung")) {
    return "merkblatt";
  }
  if (title.includes("übung") || title.includes("aufgabe") || title.includes("training")) {
    return "uebung";
  }
  if (title.includes("test") || title.includes("klausur") || title.includes("prüfung") || title.includes("quiz")) {
    return "test";
  }

  return "other";
}

// ============================================================
// Klappbarer Bereich
// ============================================================

function CollapsibleSection({
  type,
  materials,
  isTeacher,
  onDelete,
  onManageAccess,
  onOpen,
  defaultOpen = false,
}: {
  type: GroupType;
  materials: Material[];
  isTeacher: boolean;
  onDelete: (m: Material) => void;
  onManageAccess: (m: Material) => void;
  onOpen: (m: Material) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card/30">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition text-left"
      >
        {/* Chevron */}
        <span className="shrink-0 text-muted-foreground">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>

        {/* Icon */}
        <span
          className={cn(
            "w-8 h-8 rounded-lg bg-gradient-to-br grid place-items-center text-white shrink-0",
            meta.color
          )}
        >
          <Icon className="h-4 w-4" />
        </span>

        {/* Label */}
        <span className="font-semibold text-sm">{meta.label}</span>

        {/* Count */}
        <span className="text-xs text-muted-foreground">
          ({materials.length}{" "}
          {materials.length === 1 ? meta.singular : ""})
        </span>
      </button>

      {/* Content */}
      {open && (
        <div className="p-4 pt-2 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                isTeacher={isTeacher}
                onDelete={isTeacher ? onDelete : undefined}
                onManageAccess={isTeacher ? onManageAccess : undefined}
                onDownload={onOpen}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Hauptkomponente
// ============================================================

export default function MaterialienPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);
  const [accessMaterial, setAccessMaterial] = React.useState<Material | null>(
    null
  );
  const [viewMaterial, setViewMaterial] = React.useState<Material | null>(null);

  // Filter-State
  const [activeSubject, setActiveSubject] = React.useState<string>("");
  const [activeGrade, setActiveGrade] = React.useState<number | null>(null);
  const [onlyMine, setOnlyMine] = React.useState(false);

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await materialsApi.list({
        subjectId: activeSubject || undefined,
        gradeLevel: activeGrade ?? undefined,
      });
      // Client-seitiger Filter "Nur meine"
      const filtered =
        onlyMine && user
          ? data.materials.filter((m) => m.teacher_id === user.id)
          : data.materials;
      setMaterials(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  }, [activeSubject, activeGrade, onlyMine, user]);

  React.useEffect(() => {
    materialsApi
      .subjects()
      .then((data) => setSubjects(data.subjects))
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (material: Material) => {
    if (!confirm(`"${material.title}" wirklich löschen?`)) return;
    try {
      await materialsApi.delete(material.id);
      toast.success("Gelöscht", "Das Material wurde entfernt.");
      await load();
    } catch (err) {
      toast.error("Fehler", err instanceof Error ? err.message : "Fehler");
    }
  };

  const handleOpen = (material: Material) => {
    if (material.type === "html") {
      setViewMaterial(material);
    } else if (material.type === "link" && material.url) {
      window.open(material.url, "_blank", "noopener,noreferrer");
    } else if (material.type === "file") {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ??
        "https://mrk-api.pacokamegne.workers.dev";
      window.open(
        `${API_URL}/api/materials/${material.id}/download`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // Gruppierung: Fach → Klasse → Typ
  const grouped = React.useMemo(() => {
    // 1. Gruppieren nach Fach + Klasse
    const bySubjectGrade: Record<
      string,
      {
        subject: string;
        grade: number | null;
        byType: Record<GroupType, Material[]>;
      }
    > = {};

    for (const m of materials) {
      const key = `${m.subject_id}__${m.grade_level ?? "none"}`;
      if (!bySubjectGrade[key]) {
        bySubjectGrade[key] = {
          subject: m.subject_id,
          grade: m.grade_level,
          byType: {
            merkblatt: [],
            uebung: [],
            test: [],
            other: [],
          },
        };
      }
      const type = detectMaterialType(m);
      bySubjectGrade[key].byType[type].push(m);
    }

    // 2. Sortieren nach Fach, dann nach Klasse
    const subjectOrder = ["math", "physics", "chemistry", "biology"];
    return Object.values(bySubjectGrade).sort((a, b) => {
      const subjectDiff =
        subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject);
      if (subjectDiff !== 0) return subjectDiff;
      const gradeA = a.grade ?? 999;
      const gradeB = b.grade ?? 999;
      return gradeA - gradeB;
    });
  }, [materials]);

  // Verfügbare Klassen
  const availableGrades = React.useMemo(() => {
    const grades = new Set<number>();
    for (const m of materials) {
      if (m.grade_level) grades.add(m.grade_level);
    }
    return Array.from(grades).sort((a, b) => a - b);
  }, [materials]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-500" />
            Materialien
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? "Alle Materialien der Schule – oder filtere nach deinen eigenen."
              : "Deine freigeschalteten Materialien."}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4" />
            Neues Material
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="space-y-3">
        {/* Fach-Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setActiveSubject("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition font-medium",
              activeSubject === ""
                ? "bg-brand-500 text-white"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            )}
          >
            📚 Alle Fächer
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition font-medium",
                activeSubject === s.id
                  ? "bg-brand-500 text-white"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              )}
            >
              {SUBJECT_ICONS[s.id] ?? "📖"} {SUBJECT_LABELS[s.id] ?? s.name_de}
            </button>
          ))}
        </div>

        {/* Klassen-Filter + "Nur meine" */}
        <div className="flex items-center gap-2 flex-wrap pl-6">
          <span className="text-xs text-muted-foreground font-medium">
            Klasse:
          </span>
          <button
            onClick={() => setActiveGrade(null)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs transition",
              activeGrade === null
                ? "bg-accent-500 text-white"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            )}
          >
            Alle
          </button>
          {availableGrades.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGrade(g)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs transition",
                activeGrade === g
                  ? "bg-accent-500 text-white"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              )}
            >
              Kl. {g}
            </button>
          ))}

          {isTeacher && (
            <button
              onClick={() => setOnlyMine((v) => !v)}
              className={cn(
                "ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition font-medium",
                onlyMine
                  ? "bg-brand-500 text-white"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              )}
            >
              <UserIcon className="h-3 w-3" />
              {onlyMine ? "Nur meine ✓" : "Nur meine"}
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-900 dark:text-red-200">
          {error}
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">Keine Materialien</p>
          <p className="text-sm text-muted-foreground mt-1">
            {onlyMine
              ? "Du hast noch keine eigenen Materialien erstellt."
              : isTeacher
              ? "Es sind noch keine Materialien vorhanden."
              : "Aktuell sind keine Materialien freigeschaltet."}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => {
            const subjectIcon = SUBJECT_ICONS[group.subject] ?? "📖";
            const subjectLabel =
              SUBJECT_LABELS[group.subject] ?? group.subject;
            const gradeLabel = group.grade
              ? `Klasse ${group.grade}`
              : "Ohne Klasse";

            // Anzahl aller Materialien dieser Gruppe
            const totalCount = TYPE_ORDER.reduce(
              (sum, t) => sum + group.byType[t].length,
              0
            );

            return (
              <section key={`${group.subject}-${group.grade}`}>
                {/* Fach/Klassen-Header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-border">
                  <span className="text-2xl">{subjectIcon}</span>
                  <h2 className="text-xl font-bold">{subjectLabel}</h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    · {gradeLabel}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {totalCount}{" "}
                    {totalCount === 1 ? "Material" : "Materialien"}
                  </span>
                </div>

                {/* Typ-Bereiche */}
                <div className="space-y-4">
                  {TYPE_ORDER.map((type) => {
                    const items = group.byType[type];
                    if (items.length === 0) return null;

                    return (
                      <CollapsibleSection
                        key={type}
                        type={type}
                        materials={items}
                        isTeacher={isTeacher}
                        onDelete={handleDelete}
                        onManageAccess={(m) => setAccessMaterial(m)}
                        onOpen={handleOpen}
                       // defaultOpen={false}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Dialoge */}
      {showUpload && (
        <MaterialUploadDialog
          subjects={subjects}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            toast.success("Erstellt!", "Material wurde hochgeladen.");
            load();
          }}
        />
      )}

      {accessMaterial && (
        <AccessDialog
          materialId={accessMaterial.id}
          materialTitle={accessMaterial.title}
          onClose={() => setAccessMaterial(null)}
          onSuccess={() => {
            setAccessMaterial(null);
            toast.success("Gespeichert!", "Freischaltung wurde aktualisiert.");
            load();
          }}
        />
      )}

      {viewMaterial && (
        <MaterialViewer
          material={viewMaterial}
          onClose={() => setViewMaterial(null)}
        />
      )}
    </div>
  );
}
