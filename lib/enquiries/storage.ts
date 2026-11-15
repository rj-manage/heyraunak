// ============================================================
// RJ Studio - enquiry attachment storage
// ------------------------------------------------------------
// Objects live in the private `enquiries` bucket at
//   {enquiry_id}/{file_id}/{sanitised-filename}
// Only PDF, Word and Excel documents are accepted.
// ============================================================

export const ENQUIRY_BUCKET = "enquiries";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_FILES = 5;
export const SIGNED_URL_TTL_SECONDS = 300;

export const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx"]);

export const ACCEPT_ATTR = ".pdf,.doc,.docx,.xls,.xlsx";

export function extensionOf(filename: string): string {
  const name = String(filename || "").trim();
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

export interface UploadValidation {
  ok: boolean;
  reason?: "extension" | "size" | "empty";
}

export function validateUpload(filename: string, size: number): UploadValidation {
  if (!Number.isFinite(size) || size <= 0) return { ok: false, reason: "empty" };
  if (size > MAX_FILE_BYTES) return { ok: false, reason: "size" };
  if (!ALLOWED_EXTENSIONS.has(extensionOf(filename))) return { ok: false, reason: "extension" };
  return { ok: true };
}

/** Strips directories, traversal and control characters; always returns a name. */
export function sanitizeFilename(filename: string): string {
  let name = String(filename || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop() as string;

  name = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>:"|?*]/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.\s]+/, "")
    .trim();

  if (name.length > 120) {
    const ext = extensionOf(name);
    const base = ext ? name.slice(0, -(ext.length + 1)) : name;
    name = base.slice(0, 110) + (ext ? "." + ext : "");
  }

  return name || "file";
}

export function buildStoragePath(enquiryId: string, fileId: string, filename: string): string {
  return `${enquiryId}/${fileId}/${sanitizeFilename(filename)}`;
}

export function humanFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
