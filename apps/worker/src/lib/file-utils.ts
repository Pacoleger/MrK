// ============================================================
// Datei-Validierung
// ============================================================

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  // PDF
  "application/pdf": [".pdf"],
  // Word
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  // Bilder
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/heic": [".heic"],
  // Text
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  if (file.size === 0) {
    return { valid: false, error: "FILE_EMPTY" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "FILE_TOO_LARGE" };
  }
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return { valid: false, error: "FILE_TYPE_NOT_ALLOWED" };
  }
  return { valid: true };
}

/**
 * Erzeugt einen eindeutigen R2-Key.
 */
export function makeFileKey(
  prefix: string,
  userId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${userId}/${timestamp}-${random}-${safeName}`;
}
