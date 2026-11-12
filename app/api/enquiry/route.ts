// POST /api/enquiry
//
// Faithful port of the original api/enquiry.js handler as a Next.js route
// handler, so the existing js/service-enquiry.js front-end keeps working
// unchanged across the framework switch. Same request shape, same response
// codes and bodies, same security mechanisms.

import {
  MAX_BODY_BYTES,
  MIN_FILL_MS,
  RATE_MAX,
  RATE_WINDOW_MS,
  buildRow,
  enquiryId,
  stamp,
  validate
} from "@/lib/enquiry/core";
import type { EnquiryInput } from "@/lib/enquiry/core";
import { config, notify, saveToSheet, sheetConfigured } from "@/lib/enquiry/io";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function send(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd && fwd.length) return fwd.split(",")[0].trim();
  return "unknown";
}

// Per-instance fixed-window limiter, same as the original function.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_MAX;
}

export async function OPTIONS(): Promise<Response> {
  // 204 must not carry a body
  return new Response(null, { status: 204 });
}

export async function POST(request: Request): Promise<Response> {
  const cfg = config();

  if (cfg.allowedOrigin) {
    const origin = request.headers.get("origin");
    if (origin && origin !== cfg.allowedOrigin) return send(403, { error: "forbidden" });
  }

  if (rateLimited(clientIp(request))) {
    return send(429, { error: "rate_limited", message: "Too many submissions. Please try again later." });
  }

  let body: EnquiryInput;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return send(413, { error: "too_large" });
    body = JSON.parse(raw || "{}") as EnquiryInput;
  } catch {
    return send(400, { error: "bad_json" });
  }

  // bot traps: a filled honeypot or a form completed impossibly fast
  if (body.hp) return send(400, { error: "rejected" });
  if (body.form_started_at && Date.now() - Number(body.form_started_at) < MIN_FILL_MS) {
    return send(400, { error: "rejected" });
  }

  const { data, errors } = validate(body);
  if (Object.keys(errors).length) {
    return send(400, { error: "validation", fields: errors });
  }
  if (!data.idempotencyKey) {
    return send(400, { error: "validation", fields: { idempotency_key: "required" } });
  }

  // configuration check happens after validation so a misconfigured deployment
  // still reports bad input honestly
  if (!sheetConfigured(cfg)) {
    return send(503, { error: "not_configured", message: "Enquiry storage is not configured yet." });
  }

  const now = new Date();
  const id = enquiryId(data.idempotencyKey, now);
  const at = stamp(now);

  let save;
  try {
    save = await saveToSheet(cfg, buildRow(data, id, at), id);
  } catch (err) {
    console.error("enquiry: sheet save failed for " + id + " -", (err as Error)?.message);
    return send(502, {
      error: "save_failed",
      message: "We could not save your enquiry, so nothing was sent."
    });
  }

  // the row is saved - from here on failures are logged, never fatal
  const state = await notify(cfg, data, id, at);

  return send(200, {
    ok: true,
    id: save.enquiryId || id,
    email: state.email,
    ack: state.ack,
    duplicate: save.duplicate
  });
}
