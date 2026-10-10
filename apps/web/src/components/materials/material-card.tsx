"use client";

import {
  FileText,
  Link as LinkIcon,
  BookOpen,
  Download,
  Trash2,
  Users,
  User,
  ExternalLink,
  Calendar,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/materials-api";

const SUBJECT_COLORS: Record<string, string> = {
  math: "from-brand-500 to-brand-700",
  physics: "from-accent-500 to-accent-700",
  chemistry: "from-brand-600 to-accent-600",
  biology: "from-accent-400 to-brand-500",
};

export function MaterialCard({
  material,
  isTeacher,
  onDelete,
  onManageAccess,
  onDownload,
}: {
  material: Material;
  isTeacher: boolean;
  onDelete?: (material: Material) => void;
  onManageAccess?: (material: Material) => void;
  onDownload?: (material: Material) => void;
}) {
  const colorClass =
    SUBJECT_COLORS[material.subject_id] ?? "from-brand-500 to-accent-500";

  const hasAccess =
    (material.class_count ?? 0) > 0 || (material.student_count ?? 0) > 0;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClick = () => {
    if (onDownload) {
      onDownload(material);
    }
  };

  const getIcon = () => {
    if (material.type === "file") return FileText;
    if (material.type === "link") return LinkIcon;
    return BookOpen;
  };

  const getActionLabel = () => {
    if (material.type === "html") return "Lesen";
    if (material.type === "link") return "Öffnen";
    return "Download";
  };

  const getActionIcon = () => {
    if (material.type === "html") return BookOpen;
    if (material.type === "link") return ExternalLink;
    return Download;
  };

  const Icon = getIcon();
  const ActionIcon = getActionIcon();

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition">
      <div className={cn("h-1 bg-gradient-to-r", colorClass)} />

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg bg-gradient-to-br grid place-items-center text-white shrink-0",
              colorClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {material.subject_name ?? material.subject_id}
            </p>
            <h3 className="font-semibold truncate mt-0.5">{material.title}</h3>
          </div>
          {isTeacher && (
            <Badge
              variant={hasAccess ? "default" : "outline"}
              className="gap-1 shrink-0 text-[10px]"
            >
              {hasAccess ? (
                <Unlock className="h-2.5 w-2.5" />
              ) : (
                <Lock className="h-2.5 w-2.5" />
              )}
              {hasAccess ? "Freigegeben" : "Gesperrt"}
            </Badge>
          )}
        </div>

        {/* Beschreibung */}
        {material.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {material.description}
          </p>
        )}

        {/* Metadaten */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {material.teacher_first && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {material.teacher_first} {material.teacher_last}
            </span>
          )}
          {material.file_size && <span>{formatSize(material.file_size)}</span>}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(material.created_at).toLocaleDateString("de-DE")}
          </span>
        </div>

        {/* Freischaltungen (nur Lehrer) */}
        {isTeacher && hasAccess && (
          <div className="flex flex-wrap gap-2 text-xs">
            {(material.class_count ?? 0) > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Users className="h-2.5 w-2.5" />
                {material.class_count} Klassen
              </Badge>
            )}
            {(material.student_count ?? 0) > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <User className="h-2.5 w-2.5" />
                {material.student_count} Schüler
              </Badge>
            )}
          </div>
        )}

        {/* Aktionen */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            onClick={handleClick}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 transition text-sm font-medium"
          >
            <ActionIcon className="h-3.5 w-3.5" />
            {getActionLabel()}
          </button>

          {isTeacher && (
            <>
              {onManageAccess && (
                <button
                  onClick={() => onManageAccess(material)}
                  className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                  title="Freischaltung verwalten"
                >
                  <Users className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(material)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition"
                  title="Löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
