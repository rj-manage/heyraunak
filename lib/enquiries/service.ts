// ============================================================
// RJ Studio - enquiry write service (server-only)
// ------------------------------------------------------------
// Inserts the enquiry with the service-role client (anonymous
// visitors cannot insert under RLS), then stores any attachments.
// ============================================================

import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "../supabase/admin";
import { fieldsForService, getServiceForm } from "./schema";
import { buildStoragePath, ENQUIRY_BUCKET, MAX_FILES, validateUpload } from "./storage";
import { clean, enquiryRef } from "./core";
import { emailConfigured, sendTransactional } from "../email/send";
import { enquiryAdminHtml, enquiryAdminSubject, enquiryAdminText } from "../email/enquiry-templates";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

const CONTACT_IDS = new Set(["full_name", "whatsapp", "company"]);

export interface EnquirySummary {
  ref: string;
  category: string;
  service: string;
  contact: { fullName: string; whatsapp: string; company: string };
  details: { label: string; value: unknown }[];
  submittedAt: string;
}

export interface CreateEnquiryInput {
  service: string;
  idempotencyKey: string;
  answers: Record<string, unknown>;
  files: File[];
  now?: Date;
}

export interface CreateEnquiryResult {
  ref: string;
  duplicate: boolean;
  notify: EnquirySummary | null;
}

export class UnknownServiceError extends Error {}

export async function createEnquiry(input: CreateEnquiryInput): Promise<CreateEnquiryResult> {
  const form = getServiceForm(input.service);
  const fields = fieldsForService(input.service);
  if (!form || !fields) throw new UnknownServiceError("unknown_service");

  const answers = input.answers || {};
  const contact = {
    fullName: clean(answers.full_name, 200),
    whatsapp: clean(answers.whatsapp, 40),
    company: clean(answers.company, 200)
  };

  // self-describing snapshot: each answer keeps its label
  const details: { label: string; value: unknown }[] = [];
  for (const f of fields) {
    if (f.type === "file" || CONTACT_IDS.has(f.id)) continue;
    const v = answers[f.id];
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    details.push({ label: f.label, value: v });
  }

  const now = input.now ?? new Date();
  const ref = enquiryRef(input.idempotencyKey, now);
  const supabase = createSupabaseAdminClient();

  // idempotency: an earlier attempt already saved this exact enquiry
  const { data: existing } = await supabase
    .from("enquiries")
    .select("enquiry_ref")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing) return { ref: existing.enquiry_ref as string, duplicate: true, notify: null };

  const row = {
    enquiry_ref: ref,
    idempotency_key: input.idempotencyKey,
    status: "submitted",
    category_name: form.category,
    service_name: form.service,
    project_details: details,
    timeline: typeof answers.timeline === "string" && answers.timeline ? answers.timeline : null,
    contact,
    source: "website"
  };

  const { data, error } = await supabase.from("enquiries").insert(row).select("id, enquiry_ref").single();
  if (error) {
    // unique idempotency_key raced with a concurrent submit - return the winner
    if ((error as { code?: string }).code === "23505") {
      const { data: again } = await supabase
        .from("enquiries")
        .select("enquiry_ref")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (again) return { ref: again.enquiry_ref as string, duplicate: true, notify: null };
    }
    throw error;
  }
  if (!data) throw new Error("enquiry insert returned no row");

  const enquiryId = data.id as string;
  await saveAttachments(supabase, enquiryId, input.files);

  return {
    ref: data.enquiry_ref as string,
    duplicate: false,
    notify: {
      ref: data.enquiry_ref as string,
      category: form.category,
      service: form.service,
      contact,
      details,
      submittedAt: now.toISOString()
    }
  };
}

async function saveAttachments(supabase: SupabaseAdmin, enquiryId: string, files: File[]): Promise<void> {
  const list = (files || []).filter(Boolean).slice(0, MAX_FILES);
  for (const file of list) {
    const check = validateUpload(file.name, file.size);
    if (!check.ok) continue;

    const fileId = randomUUID();
    const path = buildStoragePath(enquiryId, fileId, file.name);
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(ENQUIRY_BUCKET).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
    if (error) {
      console.error("enquiry: attachment upload failed -", error.message);
      continue;
    }

    await supabase.from("enquiry_attachments").insert({
      enquiry_id: enquiryId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size
    });
  }
}

/** Best-effort admin notification - a mail failure never fails the submission. */
export async function notifyAdminEnquiry(summary: EnquirySummary): Promise<void> {
  const to = (process.env.ADMIN_NOTIFICATION_EMAIL || "").trim();
  if (!to || !emailConfigured()) return;
  await sendTransactional({
    to: [to],
    subject: enquiryAdminSubject(summary),
    html: enquiryAdminHtml(summary),
    text: enquiryAdminText(summary)
  });
}
