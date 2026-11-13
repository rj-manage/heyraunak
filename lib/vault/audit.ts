import { createSupabaseAdminClient } from "../supabase/admin";

// Vault-specific audit trail. Never records access codes, OTPs or file contents.
export type VaultEventType =
  | "code_ok"
  | "code_fail"
  | "code_locked"
  | "otp_requested"
  | "otp_verified"
  | "otp_failed"
  | "otp_expired"
  | "email_failed"
  | "session_created"
  | "session_revoked"
  | "download"
  | "download_all"
  | "code_regenerated"
  | "access_revoked"
  | "access_reactivated"
  | "handover_expired"
  | "admin_created"
  | "admin_updated"
  | "file_added"
  | "file_updated"
  | "file_removed";

export interface VaultEventInput {
  handoverId: string;
  type: VaultEventType;
  fileId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Best-effort audit write. Auditing must never break the business transaction,
 * so failures are logged and swallowed.
 */
export async function recordVaultEvent(input: VaultEventInput): Promise<void> {
  try {
    const db = createSupabaseAdminClient();
    const { error } = await db.from("project_handover_events").insert({
      handover_id: input.handoverId,
      file_id: input.fileId ?? null,
      event_type: input.type,
      event_metadata: input.metadata ?? {},
      ip: input.ip ?? null
    });
    if (error) console.error("vault: audit insert failed", error.message);
  } catch (err) {
    console.error("vault: audit write failed", (err as Error)?.message);
  }
}

/** Client IP from proxy headers, for rate limiting and audit. */
export function clientIpFrom(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd && fwd.length) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || null;
}
