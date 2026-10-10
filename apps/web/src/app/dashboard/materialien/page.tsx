"use client";

import * as React from "react";
import {
  BookOpen,
  Plus,
  Loader2,
  Inbox,
  Filter,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/materials/material-card";
import { MaterialUploadDialog } from "@/components/materials/material-upload-dialog";
import { AccessDialog } from "@/components/materials/access-dialog";
import { materialsApi, type Material, type SubjectOption } from "@/lib/materials-api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MaterialienPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);
  const [accessMaterial, setAccessMaterial] = React.useState<Material | null>(null);
  const [activeSubject, setActiveSubject] = React.useState<string>("");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await materialsApi.list({
        subjectId: activeSubject || undefined,
      });
      setMaterials(data.materials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  }, [activeSubject]);

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

  const handleDownload = async (material: Material) => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ??
        "https://mrk-api.pacokamegne.workers.dev";
      const url = `${API_URL}/api/materials/${material.id}/download`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Fehler", "Download fehlgeschlagen");
    }
  };

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
              ? "Lade Materialien hoch und schalte sie für deine Klassen frei."
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

      {/* Fächer-Filter */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setActiveSubject("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition",
              activeSubject === ""
                ? "bg-brand-500 text-white"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            )}
          >
            Alle
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition",
                activeSubject === s.id
                  ? "bg-brand-500 text-white"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              )}
            >
              {s.name_de}
            </button>
          ))}
        </div>
      )}

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
            {isTeacher
              ? "Lade dein erstes Material hoch."
              : "Aktuell sind keine Materialien freigeschaltet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              isTeacher={isTeacher}
              onDelete={isTeacher ? handleDelete : undefined}
              onManageAccess={
                isTeacher ? (mat) => setAccessMaterial(mat) : undefined
              }
              onDownload={handleDownload}
            />
          ))}
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
    </div>
  );
}
