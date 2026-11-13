import { fail, json, sameOrigin, vaultReady, notConfigured } from "@/lib/vault/http";
import { readSessionCookie } from "@/lib/vault/cookies";
import { listHandoverFiles, resolveSession } from "@/lib/vault/service";
import { createSignedDownloadUrl } from "@/lib/vault/signed";
import { recordVaultEvent } from "@/lib/vault/audit";
import { archiveFilename, planArchive, streamArchive } from "@/lib/vault/zip";
import { humanFileSize } from "@/lib/vault/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Signed URLs used while streaming the archive need to outlive the fetch inside
// this single request (not the client), so a short internal TTL is enough.
const INTERNAL_TTL_SECONDS = 300;

export async function POST(request: Request): Promise<Response> {
  if (!vaultReady()) return notConfigured();
  if (!sameOrigin(request)) return fail(403);

  const token = await readSessionCookie();
  if (!token) return fail(401);

  const active = await resolveSession(token);
  if (!active) return fail(401);

  const files = await listHandoverFiles(active.handover.id);
  const plan = planArchive(files.filter((f) => f.is_downloadable));

  if (!plan.ok) {
    if (plan.reason === "empty") return json({ ok: false, message: "There are no downloadable files yet." }, 404);
    if (plan.reason === "too_many") {
      return json({ ok: false, message: "This project has too many files for a single archive. Download them individually." }, 413);
    }
    return json({ ok: false, message: "This project is too large for a single archive. Download the files individually." }, 413);
  }

  await recordVaultEvent({
    handoverId: active.handover.id,
    type: "download_all",
    metadata: { files: plan.entries.length, bytes: plan.totalBytes, size: humanFileSize(plan.totalBytes) }
  });

  const body = streamArchive(plan.entries, (file) =>
    createSignedDownloadUrl(file.storage_path, INTERNAL_TTL_SECONDS)
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${archiveFilename(active.handover.project_name)}"`,
      "Cache-Control": "no-store"
    }
  });
}
