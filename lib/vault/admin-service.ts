import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "../supabase/admin";
import { generateAccessCode, hashAccessCode } from "./codes";
import { buildStoragePath, validateFile, VAULT_BUCKET } from "./storage";
import { recordVaultEvent } from "./audit";
import type { HandoverStatus } from "./status";

const HANDOVER_COLUMNS =
  "id, client_name, client_email, project_name, project_reference, service_category, description, handover_message, delivery_date, expires_at, status, access_code_created_at, created_at, updated_at, project_id, customer_id";

export interface AdminHandoverInput {
  clientName: string;
  clientEmail: string;
  projectName: string;
  projectReference?: string | null;
  serviceCategory?: string | null;
  description?: string | null;
  handoverMessage?: string | null;
  deliveryDate?: string | null;
  expiresAt?: string | null;
  status?: HandoverStatus;
}

export async function listHandovers() {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("project_handovers")
    .select(HANDOVER_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error("could not list handovers");

  const rows = data ?? [];
  const counts = {
    total: rows.length,
    active: rows.filter((h) => ["ready", "accessed", "completed"].includes(h.status)).length,
    draft: rows.filter((h) => ["draft", "preparing"].includes(h.status)).length,
    expired: rows.filter((h) => h.status === "expired").length,
    revoked: rows.filter((h) => h.status === "revoked").length
  };
  return { handovers: rows, counts };
}

export async function getHandoverDetail(id: string) {
  const db = createSupabaseAdminClient();
  const { data: handover } = await db.from("project_handovers").select(HANDOVER_COLUMNS).eq("id", id).maybeSingle();
  if (!handover) return null;

  const { data: files } = await db
    .from("project_handover_files")
    .select("id, storage_path, original_filename, display_name, description, category, mime_type, file_size, is_visible, is_downloadable, sort_order, deleted_at, created_at")
    .eq("handover_id", id)
    .is("deleted_at", null)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  const events = await listActivity(id);
  return { handover, files: files ?? [], events };
}

export async function createHandover(input: AdminHandoverInput, createdBy: string) {
  const db = createSupabaseAdminClient();
  const code = generateAccessCode();
  const { data, error } = await db
    .from("project_handovers")
    .insert({
      client_name: input.clientName,
      client_email: input.clientEmail,
      project_name: input.projectName,
      project_reference: input.projectReference ?? null,
      service_category: input.serviceCategory ?? null,
      description: input.description ?? null,
      handover_message: input.handoverMessage ?? null,
      delivery_date: input.deliveryDate ?? null,
      expires_at: input.expiresAt ?? null,
      status: input.status ?? "draft",
      access_code_hash: hashAccessCode(code),
      access_code_created_at: new Date().toISOString(),
      created_by: createdBy
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("could not create handover");

  await recordVaultEvent({ handoverId: data.id, type: "admin_created" });
  return { id: data.id as string, accessCode: code };
}

export async function updateHandover(id: string, patch: Partial<AdminHandoverInput>) {
  const db = createSupabaseAdminClient();
  const update: Record<string, unknown> = {};
  if (patch.clientName !== undefined) update.client_name = patch.clientName;
  if (patch.clientEmail !== undefined) update.client_email = patch.clientEmail;
  if (patch.projectName !== undefined) update.project_name = patch.projectName;
  if (patch.projectReference !== undefined) update.project_reference = patch.projectReference;
  if (patch.serviceCategory !== undefined) update.service_category = patch.serviceCategory;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.handoverMessage !== undefined) update.handover_message = patch.handoverMessage;
  if (patch.deliveryDate !== undefined) update.delivery_date = patch.deliveryDate;
  if (patch.expiresAt !== undefined) update.expires_at = patch.expiresAt;
  if (patch.status !== undefined) update.status = patch.status;
  if (!Object.keys(update).length) return;

  const { error } = await db.from("project_handovers").update(update).eq("id", id);
  if (error) throw new Error("could not update handover");
  await recordVaultEvent({ handoverId: id, type: "admin_updated", metadata: { fields: Object.keys(update) } });
}

/** Issues a new code and invalidates the old one immediately (hash is replaced). */
export async function regenerateAccessCode(id: string) {
  const db = createSupabaseAdminClient();
  const code = generateAccessCode();
  const { error } = await db
    .from("project_handovers")
    .update({ access_code_hash: hashAccessCode(code), access_code_created_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("could not regenerate code");
  await recordVaultEvent({ handoverId: id, type: "code_regenerated" });
  return code;
}

/** Revokes every live session for a handover. */
async function revokeLiveSessions(handoverId: string) {
  const db = createSupabaseAdminClient();
  await db
    .from("project_handover_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("handover_id", handoverId)
    .is("revoked_at", null);
}

export async function setHandoverStatus(id: string, status: HandoverStatus) {
  const db = createSupabaseAdminClient();
  const { error } = await db.from("project_handovers").update({ status }).eq("id", id);
  if (error) throw new Error("could not update status");

  if (status === "revoked" || status === "expired") {
    await revokeLiveSessions(id);
    await recordVaultEvent({ handoverId: id, type: status === "revoked" ? "access_revoked" : "handover_expired" });
  } else if (status === "ready" || status === "accessed") {
    await recordVaultEvent({ handoverId: id, type: "access_reactivated" });
  }
}

export async function addFile(handoverId: string, file: File) {
  const check = validateFile(file.name, file.size);
  if (!check.ok) throw new Error("file_" + check.reason);

  const db = createSupabaseAdminClient();
  const fileId = randomUUID();
  const path = buildStoragePath(handoverId, fileId, file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());

  const up = await db.storage.from(VAULT_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });
  if (up.error) throw new Error("upload_failed");

  const { error } = await db.from("project_handover_files").insert({
    id: fileId,
    handover_id: handoverId,
    storage_bucket: VAULT_BUCKET,
    storage_path: path,
    original_filename: file.name,
    display_name: file.name,
    category: "main",
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
    is_visible: true,
    is_downloadable: true
  });
  if (error) {
    await db.storage.from(VAULT_BUCKET).remove([path]);
    throw new Error("could not save file metadata");
  }

  await recordVaultEvent({ handoverId, type: "file_added", fileId, metadata: { filename: file.name } });
  return { id: fileId };
}

export async function updateFile(
  handoverId: string,
  fileId: string,
  patch: { displayName?: string | null; description?: string | null; category?: string; isVisible?: boolean; isDownloadable?: boolean; sortOrder?: number }
) {
  const db = createSupabaseAdminClient();
  const update: Record<string, unknown> = {};
  if (patch.displayName !== undefined) update.display_name = patch.displayName;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.isVisible !== undefined) update.is_visible = patch.isVisible;
  if (patch.isDownloadable !== undefined) update.is_downloadable = patch.isDownloadable;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;
  if (!Object.keys(update).length) return;

  const { error } = await db
    .from("project_handover_files")
    .update(update)
    .eq("id", fileId)
    .eq("handover_id", handoverId);
  if (error) throw new Error("could not update file");
  await recordVaultEvent({ handoverId, type: "file_updated", fileId });
}

export async function deleteFile(handoverId: string, fileId: string) {
  const db = createSupabaseAdminClient();
  const { data: row } = await db
    .from("project_handover_files")
    .select("id, storage_path")
    .eq("id", fileId)
    .eq("handover_id", handoverId)
    .maybeSingle();
  if (!row) throw new Error("not_found");

  // soft-delete the record, then remove the object
  const { error } = await db
    .from("project_handover_files")
    .update({ deleted_at: new Date().toISOString(), is_visible: false, is_downloadable: false })
    .eq("id", fileId)
    .eq("handover_id", handoverId);
  if (error) throw new Error("could not delete file");

  await db.storage.from(VAULT_BUCKET).remove([row.storage_path]);
  await recordVaultEvent({ handoverId, type: "file_removed", fileId });
}

export async function listActivity(handoverId: string) {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("project_handover_events")
    .select("id, event_type, file_id, event_metadata, created_at")
    .eq("handover_id", handoverId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}
