"use client";

import * as React from "react";
import {
  X,
  Loader2,
  Upload,
  Link as LinkIcon,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { materialsApi, type SubjectOption } from "@/lib/materials-api";
import { cn } from "@/lib/utils";

export function MaterialUploadDialog({
  subjects,
  onClose,
  onSuccess,
}: {
  subjects: SubjectOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = React.useState<"file" | "link">("file");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [subjectId, setSubjectId] = React.useState(subjects[0]?.id ?? "");
  const [file, setFile] = React.useState<File | null>(null);
  const [url, setUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) return setError("Titel ist erforderlich");
    if (!subjectId) return setError("Fach ist erforderlich");
    if (type === "file" && !file) return setError("Datei ist erforderlich");
    if (type === "link" && !url.trim()) return setError("URL ist erforderlich");

    setIsSubmitting(true);
    try {
      await materialsApi.create({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId,
        file: type === "file" ? file! : undefined,
        url: type === "link" ? url.trim() : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Hochladen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-xl bg-card rounded-2xl shadow-2xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Neues Material</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Type-Auswahl */}
          <div className="space-y-2">
            <Label>Was möchtest du teilen?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("file")}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition",
                  type === "file"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500"
                    : "border-border hover:bg-muted"
                )}
              >
                <Upload className="h-4 w-4" />
                Datei hochladen
              </button>
              <button
                type="button"
                onClick={() => setType("link")}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition",
                  type === "link"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500"
                    : "border-border hover:bg-muted"
                )}
              >
                <LinkIcon className="h-4 w-4" />
                Link teilen
              </button>
            </div>
          </div>

          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder="z.B. Erklärung Quadratische Funktionen"
            />
          </div>

          {/* Beschreibung */}
          <div className="space-y-2">
            <Label htmlFor="desc">Beschreibung (optional)</Label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Kurze Beschreibung..."
              className="w-full min-h-[80px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-y"
            />
          </div>

          {/* Fach */}
          <div className="space-y-2">
            <Label htmlFor="subject">Fach</Label>
            <select
              id="subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_de}
                </option>
              ))}
            </select>
          </div>

          {/* Datei-Upload */}
          {type === "file" && (
            <div className="space-y-2">
              <Label>Datei</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="rounded-xl border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-muted/50 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.txt,.md"
                  onChange={handleFileSelect}
                  disabled={isSubmitting}
                />
                {file ? (
                  <div className="flex items-center gap-3 justify-center">
                    <FileText className="h-5 w-5 text-brand-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">
                      Klick oder zieh Datei hierher
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Word, Bilder · max. 20 MB
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Link-Input */}
          {type === "link" && (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Hochladen...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Material erstellen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
