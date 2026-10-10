"use client";

import * as React from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Material } from "@/lib/materials-api";

export function MaterialViewer({
  material,
  onClose,
}: {
  material: Material;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-card rounded-2xl shadow-2xl border border-border max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {material.subject_name ?? material.subject_id}
            </p>
            <h2 className="text-lg font-semibold mt-1">{material.title}</h2>
            {material.teacher_first && (
              <p className="text-xs text-muted-foreground mt-0.5">
                von {material.teacher_first} {material.teacher_last}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition shrink-0"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {material.type === "html" && material.content ? (
            <div
              className="text-sm leading-relaxed space-y-3
                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-foreground
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                [&_p]:my-2 [&_p]:text-foreground
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:space-y-1
                [&_li]:text-foreground
                [&_strong]:font-semibold [&_strong]:text-foreground
                [&_em]:italic
                [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                [&_table]:w-full [&_table]:border [&_table]:border-border [&_table]:rounded [&_table]:my-3
                [&_th]:bg-muted [&_th]:p-2 [&_th]:border [&_th]:border-border [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold
                [&_td]:p-2 [&_td]:border [&_td]:border-border [&_td]:text-xs
                [&_details]:bg-muted/30 [&_details]:p-3 [&_details]:rounded [&_details]:mt-2 [&_details]:border [&_details]:border-border
                [&_summary]:cursor-pointer [&_summary]:font-medium [&_summary]:text-brand-600 [&_summary]:text-xs
                [&_details[open]_summary]:mb-2"
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          ) : material.type === "link" && material.url ? (
            <div className="text-center py-10 space-y-4">
              <p className="text-sm text-muted-foreground">
                Dieses Material ist ein externer Link.
              </p>
              <Button asChild>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Link öffnen
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              Kein Inhalt verfügbar.
            </p>
          )}

          {material.description && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                {material.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
