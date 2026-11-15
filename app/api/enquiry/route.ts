// POST /api/enquiry
//
// Public service-enquiry submission. Accepts multipart form data:
//   payload : JSON string { service, idempotency_key, started_at, hp, answers }
//   files   : zero or more attachments (PDF / Word / Excel)
//
// Anonymous visitors cannot insert under RLS, so this route uses the
// service-role client. Guarded by same-origin, a per-IP rate limit, a honeypot
// and a minimum fill time.

import { json, sameOrigin } from "@/lib/vault/http";
import { supabaseConfigured } from "@/lib/supabase/env";
import { clientIpFrom, MIN_FILL_MS, rateLimited } from "@/lib/enquiries/core";
import { fieldsForService, getServiceForm } from "@/lib/enquiries/schema";
import { buildAnswersSchema, enquiryPayloadSchema, fieldErrors } from "@/lib/enquiries/validation";
import { createEnquiry, notifyAdminEnquiry, UnknownServiceError } from "@/lib/enquiries/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!supabaseConfigured()) {
    return json({ ok: false, message: "Enquiries are not available right now." }, 503);
  }
  if (!sameOrigin(request)) {
    return json({ ok: false, message: "Forbidden." }, 403);
  }

  const ip = clientIpFrom(request.headers);
  if (rateLimited(ip)) {
    return json(
      { ok: false, message: "Too many submissions from this connection. Please try again in a few minutes." },
      429
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const raw = formData.get("payload");
  if (typeof raw !== "string" || !raw) {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const parsed = enquiryPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const { service, idempotency_key, started_at, hp, answers } = parsed.data;

  // bot traps
  if (hp) return json({ ok: false, message: "Rejected." }, 400);
  if (started_at && Date.now() - started_at < MIN_FILL_MS) {
    return json({ ok: false, message: "Rejected." }, 400);
  }

  const fields = fieldsForService(service);
  if (!getServiceForm(service) || !fields) {
    return json({ ok: false, message: "Unknown service." }, 400);
  }

  const answersResult = buildAnswersSchema(fields).safeParse(answers ?? {});
  if (!answersResult.success) {
    return json(
      { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(answersResult.error) },
      400
    );
  }

  const files = formData.getAll("files").filter((f): f is File => typeof f !== "string" && f.size > 0);

  let result;
  try {
    result = await createEnquiry({
      service,
      idempotencyKey: idempotency_key,
      answers: answersResult.data as Record<string, unknown>,
      files
    });
  } catch (err) {
    if (err instanceof UnknownServiceError) {
      return json({ ok: false, message: "Unknown service." }, 400);
    }
    console.error("enquiry: save failed -", (err as Error)?.message);
    return json({ ok: false, message: "We could not save your enquiry. Please try again." }, 502);
  }

  if (result.notify) {
    notifyAdminEnquiry(result.notify).catch((err) => {
      console.error("enquiry: admin email failed -", (err as Error)?.message);
    });
  }

  return json({ ok: true, ref: result.ref });
}
