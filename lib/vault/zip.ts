import "server-only";
import { ZipArchive } from "archiver";
import { Readable } from "node:stream";
import { MAX_ZIP_FILES, MAX_ZIP_TOTAL_BYTES, humanFileSize, sanitizeFilename } from "./storage";
import type { HandoverFileRow } from "./service";

export interface ZipEntry {
  file: HandoverFileRow;
  entryName: string;
}

// archiver v8 exports named archive classes (Archiver, ZipArchive, ...); the
// callable factory from v7 no longer exists. Construct ZipArchive directly.

export type ZipPlan =
  | { ok: true; entries: ZipEntry[]; totalBytes: number }
  | { ok: false; reason: "empty" | "too_many" | "too_large" };

/** Decides what goes into an archive, never crossing the handover boundary. */
export function planArchive(files: HandoverFileRow[]): ZipPlan {
  const downloadable = files.filter((f) => f.file_size !== null);

  if (downloadable.length === 0) return { ok: false, reason: "empty" };
  if (downloadable.length > MAX_ZIP_FILES) return { ok: false, reason: "too_many" };

  const totalBytes = downloadable.reduce((sum, f) => sum + (f.file_size ?? 0), 0);
  if (totalBytes > MAX_ZIP_TOTAL_BYTES) return { ok: false, reason: "too_large" };

  const used = new Set<string>();
  const entries: ZipEntry[] = downloadable.map((file) => {
    const base = sanitizeFilename(file.display_name || file.original_filename);
    let name = base;
    let n = 2;
    while (used.has(name.toLowerCase())) {
      const dot = base.lastIndexOf(".");
      name = dot > 0 ? `${base.slice(0, dot)} (${n})${base.slice(dot)}` : `${base} (${n})`;
      n++;
    }
    used.add(name.toLowerCase());
    return { file, entryName: name };
  });

  return { ok: true, entries, totalBytes };
}

export function archiveFilename(projectName: string): string {
  const base = sanitizeFilename(projectName).replace(/\.[a-z0-9]+$/i, "");
  return `${base || "project"}-project-files.zip`;
}

export function sizeLabel(bytes: number): string {
  return humanFileSize(bytes);
}

/**
 * Streams a ZIP built from already-signed URLs. Nothing is buffered to disk and
 * only files belonging to this handover are ever appended.
 */
export function streamArchive(
  entries: ZipEntry[],
  signedUrlFor: (file: HandoverFileRow) => Promise<string | null>
): ReadableStream<Uint8Array> {
  const archive = new ZipArchive({ zlib: { level: 6 } });

  const body = Readable.toWeb(archive as unknown as Readable) as ReadableStream<Uint8Array>;

  void (async () => {
    try {
      for (const entry of entries) {
        const url = await signedUrlFor(entry.file);
        if (!url) continue;
        const res = await fetch(url);
        if (!res.ok || !res.body) continue;
        archive.append(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), {
          name: entry.entryName
        });
      }
      await archive.finalize();
    } catch (err) {
      console.error("vault: archive failed", (err as Error)?.message);
      archive.abort();
    }
  })();

  return body;
}
