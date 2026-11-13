// Shared response + CSRF helpers for the Project Vault endpoints.

import { supabaseConfigured } from "../supabase/env";
import { vaultSecretConfigured } from "./secret";

/**
 * One message for every failure mode. Callers must never learn whether a code,
 * email or handover exists.
 */
export const GENERIC_ERROR = "We couldn't verify those details. Please check and try again.";
export const LOCKED_ERROR = "Too many attempts. Please wait a few minutes and try again.";
export const BUSY_ERROR = "Please wait a moment before requesting another code.";
export const NOT_CONFIGURED = "The Project Vault is not configured yet.";

/** True only when both the database/storage and the hashing pepper exist. */
export function vaultReady(): boolean {
  return supabaseConfigured() && vaultSecretConfigured();
}

export function notConfigured(): Response {
  return json({ ok: false, message: NOT_CONFIGURED }, 503);
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export function fail(status = 400, message: string = GENERIC_ERROR, extra?: Record<string, unknown>): Response {
  return json({ ok: false, message, ...(extra ?? {}) }, status);
}

/**
 * Browser POSTs must come from our own origin. Paired with the SameSite=Lax
 * session cookie this is the CSRF defence. A missing Origin (server-to-server,
 * or some same-origin fetches) is allowed through.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function tooMany(retryAfterSeconds?: number): Response {
  const res = json({ ok: false, message: LOCKED_ERROR }, 429);
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    res.headers.set("Retry-After", String(retryAfterSeconds));
  }
  return res;
}
