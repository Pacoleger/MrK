"use client";

import * as React from "react";
import { Upload, X, FileText, ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { assignmentsApi } from "@/lib/assignments-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id: string;
  fileName: string;
  size: number;
  type: string;
}

export function UploadZone({
  submissionId,
  assignmentId,
  disabled,
}: {
  submissionId?: string;
  assignmentId?: string;
  disabled?: boolean;
}) {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(fileList)) {
        // Größen-Check (20 MB)
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`${file.name}: Datei größer als 20 MB`);
        }
        const result = await assignmentsApi.uploadFile(
          file,
          submissionId,
          assignmentId
        );
        setFiles((prev) => [
          ...prev,
          {
            id: result.id,
            fileName: result.fileName,
            size: result.size,
            type: file.type,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition",
          dragging
            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
            : "border-border hover:border-brand-400 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.txt,.md"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm text-muted-foreground">Lädt hoch...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Klick oder zieh Dateien hierher
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, Bilder · max. 20 MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 px-1">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-4 w-4 text-accent-500" />
              ) : (
                <FileText className="h-4 w-4 text-brand-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)}
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-accent-500" />
              <button
                onClick={() =>
                  setFiles((prev) => prev.filter((f) => f.id !== file.id))
                }
                className="p-1 rounded hover:bg-muted transition"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
