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
    // Esc schließt
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("modal-open");
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
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
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
              className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-semibold prose-headings:text-foreground
                prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                prose-p:text-foreground prose-p:leading-relaxed
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
                prose-ul:my-3 prose-ol:my-3 prose-li:my-1
                prose-strong:text-foreground prose-strong:font-semibold
                prose-table:border prose-table:border-border
                prose-th:bg-muted prose-th:p-2 prose-th:border prose-th:border-border prose-th:text-left
                prose-td:p-2 prose-td:border prose-td:border-border
                prose-details:bg-muted/30 prose-details:p-3 prose-details:rounded prose-details:mt-2
                prose-summary:cursor-pointer prose-summary:font-medium prose-summary:text-brand-600"
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
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
