import { fail } from "@/lib/vault/http";
import { readSessionCookie } from "@/lib/vault/cookies";
import { getHandoverFile, resolveSession } from "@/lib/vault/service";
import { createSignedDownloadUrl } from "@/lib/vault/signed";
import { recordVaultEvent } from "@/lib/vault/audit";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/vault/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  const token = await readSessionCookie();
  if (!token) return fail(401);

  const active = await resolveSession(token);
  if (!active) return fail(401);

  // scoped lookup: another handover's file id simply does not resolve
  const file = await getHandoverFile(active.handover.id, id);
  if (!file || !file.is_visible || !file.is_downloadable) return fail(404);

  const url = await createSignedDownloadUrl(file.storage_path, SIGNED_URL_TTL_SECONDS);
  if (!url) return fail(502, "That file could not be prepared for download.");

  await recordVaultEvent({
    handoverId: active.handover.id,
    type: "download",
    fileId: file.id,
    metadata: { filename: file.original_filename }
  });

  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store" }
  });
}
