// Private storage helpers for Project Vault.
//
// Objects live in the private `project-vault` bucket at
//   project-vault/{handover_id}/{file_id}/{sanitised-filename}
// Random file ids mean a path never derives from a client name, email or code.

export const VAULT_BUCKET = "project-vault";

export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB per file
export const MAX_ZIP_FILES = 200;
export const MAX_ZIP_TOTAL_BYTES = 500 * 1024 * 1024; // 500 MB per archive
export const SIGNED_URL_TTL_SECONDS = 60;

const ALLOWED_EXTENSIONS = new Set([
  // archives / packages
  "zip", "tar", "gz", "tgz", "7z", "rar",
  // documents
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "rtf", "csv", "json", "xml", "yml", "yaml",
  // source / config
  "js", "mjs", "cjs", "ts", "tsx", "jsx", "html", "htm", "css", "scss", "sass", "less",
  "php", "py", "rb", "go", "rs", "java", "kt", "swift", "cs", "c", "h", "cpp", "hpp",
  "sql", "sh", "bat", "ps1", "env", "ini", "toml", "conf", "lock",
  // assets
  "png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico", "bmp", "tiff",
  "mp4", "mov", "webm", "mp3", "wav", "ogg", "m4a",
  "woff", "woff2", "ttf", "otf", "eot",
  "fig", "sketch", "xd", "psd", "ai", "eps",
  "glb", "gltf", "fbx", "obj", "stl"
]);

const BLOCKED_EXTENSIONS = new Set([
  "exe", "dll", "so", "dylib", "bin", "msi", "apk", "jar", "com", "scr", "vbs", "js.map"
]);

export function extensionOf(filename: string): string {
  const name = String(filename || "").trim();
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

export interface FileValidation {
  ok: boolean;
  reason?: "extension" | "size" | "empty";
}

export function validateFile(filename: string, size: number): FileValidation {
  const ext = extensionOf(filename);
  if (!ext || BLOCKED_EXTENSIONS.has(ext) || !ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, reason: "extension" };
  }
  if (!Number.isFinite(size) || size <= 0) return { ok: false, reason: "empty" };
  if (size > MAX_FILE_BYTES) return { ok: false, reason: "size" };
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

export function buildStoragePath(handoverId: string, fileId: string, filename: string): string {
  return `${VAULT_BUCKET}/${handoverId}/${fileId}/${sanitizeFilename(filename)}`;
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
