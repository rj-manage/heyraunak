import "server-only";
import { createSupabaseAdminClient } from "../supabase/admin";
import { VAULT_BUCKET } from "./storage";

/**
 * Mints a short-lived signed URL for a private object. Only ever called after the
 * caller has checked that the file belongs to the session's handover.
 */
export async function createSignedDownloadUrl(
  storagePath: string,
  ttlSeconds: number
): Promise<string | null> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.storage.from(VAULT_BUCKET).createSignedUrl(storagePath, ttlSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
