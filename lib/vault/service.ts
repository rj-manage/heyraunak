import { createSupabaseAdminClient } from "../supabase/admin";
import { hashAccessCode, maskEmail } from "./codes";
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
  generateIssueToken,
  generateOtp,
  hashIssueToken,
  hashOtp,
  otpExpiryFrom
} from "./otp";
import {
  SESSION_IDLE_MINUTES,
  absoluteExpiryFrom,
  generateSessionToken,
  hashSessionToken,
  idleExpiryFrom
} from "./session";
import { effectiveStatus, isClientAccessible, type HandoverStatus } from "./status";
import { recordVaultEvent } from "./audit";

export const MAX_CODE_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export interface HandoverRow {
  id: string;
  project_id: string | null;
  customer_id: string | null;
  client_name: string;
  client_email: string;
  project_name: string;
  project_reference: string | null;
  service_category: string | null;
  description: string | null;
  handover_message: string | null;
  delivery_date: string | null;
  expires_at: string | null;
  status: HandoverStatus;
  failed_attempts: number;
  locked_until: string | null;
}

export interface HandoverFileRow {
  id: string;
  handover_id: string;
  storage_path: string;
  original_filename: string;
  display_name: string | null;
  description: string | null;
  category: "main" | "documentation" | "assets" | "additional";
  mime_type: string | null;
  file_size: number | null;
  is_visible: boolean;
  is_downloadable: boolean;
  created_at: string;
}

const HANDOVER_COLUMNS =
  "id, project_id, customer_id, client_name, client_email, project_name, project_reference, service_category, description, handover_message, delivery_date, expires_at, status, failed_attempts, locked_until";

// ---------------------------------------------------------------
// access code
// ---------------------------------------------------------------

export interface CodeLookup {
  handover: HandoverRow | null;
  lockedUntil: Date | null;
}

/**
 * Looks a code up by its HMAC. The hash is always computed, so a wrong code and
 * an unknown code take the same path.
 */
export async function findHandoverByCode(rawCode: string): Promise<CodeLookup> {
  const db = createSupabaseAdminClient();
  const hash = hashAccessCode(rawCode);

  const { data, error } = await db
    .from("project_handovers")
    .select(HANDOVER_COLUMNS)
    .eq("access_code_hash", hash)
    .maybeSingle<HandoverRow>();

  if (error) throw new Error("code lookup failed");
  if (!data) return { handover: null, lockedUntil: null };

  const lockedUntil = data.locked_until ? new Date(data.locked_until) : null;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return { handover: null, lockedUntil };
  }

  return { handover: data, lockedUntil: null };
}

export async function registerFailedCodeAttempt(handoverId: string, ip: string | null): Promise<void> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("project_handovers")
    .select("failed_attempts")
    .eq("id", handoverId)
    .maybeSingle<{ failed_attempts: number }>();

  const attempts = (data?.failed_attempts ?? 0) + 1;
  const lock = attempts >= MAX_CODE_ATTEMPTS;

  await db
    .from("project_handovers")
    .update({
      failed_attempts: lock ? 0 : attempts,
      locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString() : null
    })
    .eq("id", handoverId);

  await recordVaultEvent({
    handoverId,
    type: lock ? "code_locked" : "code_fail",
    metadata: { attempts },
    ip
  });
}

export async function clearFailedCodeAttempts(handoverId: string): Promise<void> {
  const db = createSupabaseAdminClient();
  await db.from("project_handovers").update({ failed_attempts: 0, locked_until: null }).eq("id", handoverId);
}

// ---------------------------------------------------------------
// OTP
// ---------------------------------------------------------------

export interface IssuedOtp {
  issueToken: string;
  otp: string;
  maskedEmail: string;
  expiresAt: Date;
}

export async function countRecentOtpRequests(handoverId: string, sinceMinutes: number): Promise<number> {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
  const { count } = await db
    .from("project_handover_events")
    .select("id", { count: "exact", head: true })
    .eq("handover_id", handoverId)
    .eq("event_type", "otp_requested")
    .gte("created_at", since);
  return count ?? 0;
}

export async function secondsSinceLastOtp(handoverId: string): Promise<number | null> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("project_handover_otps")
    .select("created_at")
    .eq("handover_id", handoverId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ created_at: string }>();
  if (!data) return null;
  return Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000);
}

/**
 * Issues a fresh OTP. Prior unconsumed OTPs for this handover are consumed first,
 * so only the newest code can ever be redeemed.
 */
export async function issueOtp(handover: HandoverRow): Promise<IssuedOtp> {
  const db = createSupabaseAdminClient();

  await db
    .from("project_handover_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("handover_id", handover.id)
    .is("consumed_at", null);

  const issueToken = generateIssueToken();
  const otp = generateOtp();
  const expiresAt = otpExpiryFrom(new Date());

  const { error } = await db.from("project_handover_otps").insert({
    handover_id: handover.id,
    issue_token_hash: hashIssueToken(issueToken),
    otp_hash: hashOtp(handover.id, otp, issueToken),
    expires_at: expiresAt.toISOString()
  });

  if (error) throw new Error("could not issue otp");

  return { issueToken, otp, maskedEmail: maskEmail(handover.client_email), expiresAt };
}

export type OtpVerifyResult =
  | { ok: true; handover: HandoverRow; sessionToken: string; expiresAt: Date }
  | { ok: false; reason: "invalid" | "expired" | "too_many" | "unknown" };

/** Resolves an issue token to its handover, for resend only. */
export async function resolveIssueToken(issueToken: string): Promise<HandoverRow | null> {
  const db = createSupabaseAdminClient();
  const { data: row } = await db
    .from("project_handover_otps")
    .select("handover_id, consumed_at, expires_at")
    .eq("issue_token_hash", hashIssueToken(issueToken))
    .maybeSingle<{ handover_id: string; consumed_at: string | null; expires_at: string }>();

  if (!row || row.consumed_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  const { data: handover } = await db
    .from("project_handovers")
    .select(HANDOVER_COLUMNS)
    .eq("id", row.handover_id)
    .maybeSingle<HandoverRow>();

  if (!handover || !isClientAccessible(handover)) return null;
  return handover;
}

export interface OtpContext {
  ip: string | null;
  userAgent: string | null;
}

export async function verifyOtp(
  issueToken: string,
  otp: string,
  ctx: OtpContext
): Promise<OtpVerifyResult> {
  const db = createSupabaseAdminClient();

  const { data: row } = await db
    .from("project_handover_otps")
    .select("id, handover_id, otp_hash, expires_at, attempts, consumed_at")
    .eq("issue_token_hash", hashIssueToken(issueToken))
    .maybeSingle<{
      id: string;
      handover_id: string;
      otp_hash: string;
      expires_at: string;
      attempts: number;
      consumed_at: string | null;
    }>();

  if (!row) return { ok: false, reason: "unknown" };
  if (row.consumed_at) return { ok: false, reason: "invalid" };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await recordVaultEvent({ handoverId: row.handover_id, type: "otp_expired", ip: ctx.ip });
    return { ok: false, reason: "expired" };
  }
  if (row.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "too_many" };

  const matches = row.otp_hash === hashOtp(row.handover_id, otp, issueToken);

  if (!matches) {
    await db
      .from("project_handover_otps")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    await recordVaultEvent({ handoverId: row.handover_id, type: "otp_failed", metadata: { attempts: row.attempts + 1 }, ip: ctx.ip });
    return { ok: false, reason: "invalid" };
  }

  const { data: handover } = await db
    .from("project_handovers")
    .select(HANDOVER_COLUMNS)
    .eq("id", row.handover_id)
    .maybeSingle<HandoverRow>();

  if (!handover || !isClientAccessible(handover)) return { ok: false, reason: "invalid" };

  await db.from("project_handover_otps").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

  // first successful access promotes a released handover to "accessed"
  if (effectiveStatus(handover) === "ready") {
    await db.from("project_handovers").update({ status: "accessed" }).eq("id", handover.id);
    handover.status = "accessed";
  }

  const sessionToken = generateSessionToken();
  const expiresAt = idleExpiryFrom(new Date());

  await db.from("project_handover_sessions").insert({
    handover_id: handover.id,
    session_token_hash: hashSessionToken(sessionToken),
    expires_at: absoluteExpiryFrom(new Date()).toISOString(),
    last_activity_at: new Date().toISOString(),
    ip: ctx.ip,
    user_agent: ctx.userAgent
  });

  await recordVaultEvent({ handoverId: handover.id, type: "otp_verified", ip: ctx.ip });
  await recordVaultEvent({ handoverId: handover.id, type: "session_created", ip: ctx.ip });

  return { ok: true, handover, sessionToken, expiresAt };
}

// ---------------------------------------------------------------
// session
// ---------------------------------------------------------------

export interface ActiveSession {
  sessionId: string;
  handover: HandoverRow;
}

/**
 * Resolves a session token to its handover. Rejects revoked sessions, sessions
 * past their idle or absolute expiry, and handovers that are no longer live.
 */
export async function resolveSession(token: string): Promise<ActiveSession | null> {
  const db = createSupabaseAdminClient();

  const { data: session } = await db
    .from("project_handover_sessions")
    .select("id, handover_id, expires_at, last_activity_at, revoked_at")
    .eq("session_token_hash", hashSessionToken(token))
    .maybeSingle<{
      id: string;
      handover_id: string;
      expires_at: string;
      last_activity_at: string;
      revoked_at: string | null;
    }>();

  if (!session || session.revoked_at) return null;

  const now = Date.now();
  if (new Date(session.expires_at).getTime() <= now) return null;
  if (new Date(session.last_activity_at).getTime() + SESSION_IDLE_MINUTES * 60 * 1000 <= now) return null;

  const { data: handover } = await db
    .from("project_handovers")
    .select(HANDOVER_COLUMNS)
    .eq("id", session.handover_id)
    .maybeSingle<HandoverRow>();

  if (!handover || !isClientAccessible(handover)) return null;

  await db
    .from("project_handover_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", session.id);

  return { sessionId: session.id, handover };
}

export async function revokeSession(token: string): Promise<void> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("project_handover_sessions")
    .select("id, handover_id")
    .eq("session_token_hash", hashSessionToken(token))
    .maybeSingle<{ id: string; handover_id: string }>();

  if (!data) return;
  await db.from("project_handover_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", data.id);
  await recordVaultEvent({ handoverId: data.handover_id, type: "session_revoked" });
}

// ---------------------------------------------------------------
// files
// ---------------------------------------------------------------

const FILE_COLUMNS =
  "id, handover_id, storage_path, original_filename, display_name, description, category, mime_type, file_size, is_visible, is_downloadable, created_at";

export async function listHandoverFiles(handoverId: string): Promise<HandoverFileRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("project_handover_files")
    .select(FILE_COLUMNS)
    .eq("handover_id", handoverId)
    .is("deleted_at", null)
    .eq("is_visible", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error("could not list files");
  return (data ?? []) as HandoverFileRow[];
}

/** Looks a file up scoped to the handover, so a swapped id cannot cross clients. */
export async function getHandoverFile(handoverId: string, fileId: string): Promise<HandoverFileRow | null> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("project_handover_files")
    .select(FILE_COLUMNS)
    .eq("id", fileId)
    .eq("handover_id", handoverId)
    .is("deleted_at", null)
    .maybeSingle<HandoverFileRow>();
  return data ?? null;
}
