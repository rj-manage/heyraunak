// ============================================================
// RJ Studio - enquiry core helpers (pure, no I/O)
// ============================================================

import { createHash } from "node:crypto";

export const MAX_BODY_BYTES = 48 * 1024 * 1024; // multipart total (files dominate)
export const MAX_TEXT = 4000;
export const MAX_SHORT = 300;
export const MIN_FILL_MS = 2500;
export const RATE_WINDOW_MS = 10 * 60 * 1000;
export const RATE_MAX = 8;

/** RJ-YYYYMMDD-XXXXXXXX - stable per idempotency key so a retry keeps its ref. */
export function enquiryRef(idempotencyKey: string, now: Date): string {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  const digest = createHash("sha256").update(String(idempotencyKey)).digest("hex").slice(0, 8).toUpperCase();
  return `RJ-${day}-${digest}`;
}

/** Trim + cap any incoming value. */
export function clean(value: unknown, max = MAX_TEXT): string {
  const s = typeof value === "string" ? value : value == null ? "" : String(value);
  return s.trim().slice(0, max);
}

/* ---------- per-IP fixed-window rate limiter ---------- */

const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_MAX;
}

export function clientIpFrom(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd && fwd.length) return fwd.split(",")[0].trim();
  return "unknown";
}
