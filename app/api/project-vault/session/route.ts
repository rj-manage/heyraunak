import { json } from "@/lib/vault/http";
import { readSessionCookie } from "@/lib/vault/cookies";
import { listHandoverFiles, resolveSession } from "@/lib/vault/service";
import { humanFileSize } from "@/lib/vault/storage";
import { HANDOVER_STATUS_LABELS, effectiveStatus } from "@/lib/vault/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const token = await readSessionCookie();
  if (!token) return json({ ok: false }, 401);

  const active = await resolveSession(token);
  if (!active) return json({ ok: false }, 401);

  const { handover } = active;
  const files = await listHandoverFiles(handover.id);
  const status = effectiveStatus(handover);

  return json({
    ok: true,
    project: {
      name: handover.project_name,
      reference: handover.project_reference,
      status,
      statusLabel: HANDOVER_STATUS_LABELS[status],
      deliveryDate: handover.delivery_date,
      serviceCategory: handover.service_category,
      description: handover.description,
      handoverMessage: handover.handover_message,
      expiresAt: handover.expires_at
    },
    files: files.map((file) => ({
      id: file.id,
      name: file.display_name || file.original_filename,
      originalFilename: file.original_filename,
      description: file.description,
      category: file.category,
      mimeType: file.mime_type,
      size: file.file_size,
      sizeLabel: humanFileSize(file.file_size),
      uploadedAt: file.created_at,
      downloadable: file.is_downloadable,
      downloadUrl: `/api/project-vault/files/${file.id}/download`
    }))
  });
}
