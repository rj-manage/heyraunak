// ============================================================
// RJ Studio - enquiry admin data access (server-only)
// Uses the service-role client; callers must check the guard first.
// ============================================================

import "server-only";
import { createSupabaseAdminClient } from "../supabase/admin";
import { ENQUIRY_BUCKET, SIGNED_URL_TTL_SECONDS, humanFileSize } from "./storage";
import type { EnquiryStatus } from "./validation";

export interface EnquiryListRow {
  id: string;
  enquiry_ref: string;
  category_name: string;
  service_name: string;
  status: string;
  contact: { fullName?: string; email?: string; whatsapp?: string; company?: string };
  submitted_at: string;
}

export interface EnquiryCounts {
  total: number;
  submitted: number;
  under_review: number;
  qualified: number;
  closed: number;
}

export interface EnquiryAttachment {
  id: string;
  file_name: string;
  mime_type: string | null;
  size: string;
  url: string | null;
}

export interface EnquiryDetail {
  enquiry: EnquiryListRow & {
    project_details: { label: string; value: unknown }[];
    timeline: string | null;
    source: string | null;
  };
  attachments: EnquiryAttachment[];
}

export async function listEnquiries(): Promise<{ enquiries: EnquiryListRow[]; counts: EnquiryCounts }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("id, enquiry_ref, category_name, service_name, status, contact, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const enquiries = (data ?? []) as EnquiryListRow[];
  const counts: EnquiryCounts = { total: enquiries.length, submitted: 0, under_review: 0, qualified: 0, closed: 0 };
  for (const row of enquiries) {
    if (row.status === "submitted") counts.submitted++;
    else if (row.status === "under_review") counts.under_review++;
    else if (row.status === "qualified") counts.qualified++;
    else if (row.status === "closed") counts.closed++;
  }
  return { enquiries, counts };
}

export async function getEnquiryDetail(id: string): Promise<EnquiryDetail | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.from("enquiries").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: rows } = await supabase
    .from("enquiry_attachments")
    .select("id, storage_path, file_name, mime_type, size_bytes")
    .eq("enquiry_id", id)
    .order("created_at", { ascending: true });

  const attachments: EnquiryAttachment[] = [];
  for (const a of (rows ?? []) as {
    id: string;
    storage_path: string;
    file_name: string;
    mime_type: string | null;
    size_bytes: number | null;
  }[]) {
    const { data: signed } = await supabase.storage
      .from(ENQUIRY_BUCKET)
      .createSignedUrl(a.storage_path, SIGNED_URL_TTL_SECONDS);
    attachments.push({
      id: a.id,
      file_name: a.file_name,
      mime_type: a.mime_type,
      size: humanFileSize(a.size_bytes),
      url: signed?.signedUrl ?? null
    });
  }

  return { enquiry: data as EnquiryDetail["enquiry"], attachments };
}

export interface EnquiryUpdateTarget {
  id: string;
  enquiry_ref: string;
  service_name: string;
  category_name: string;
  contact: { fullName?: string; email?: string; whatsapp?: string; company?: string };
}

/** Lean lookup for the "Send Update" action - contact + ref only. */
export async function getEnquiryUpdateTarget(id: string): Promise<EnquiryUpdateTarget | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("id, enquiry_ref, service_name, category_name, contact")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as EnquiryUpdateTarget | null) ?? null;
}

export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Permanently removes an enquiry: storage objects first, then the row (attachments cascade). */
export async function deleteEnquiry(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: files } = await supabase
    .from("enquiry_attachments")
    .select("storage_path")
    .eq("enquiry_id", id);
  const paths = (files ?? [])
    .map((f: { storage_path: string }) => f.storage_path)
    .filter(Boolean);
  if (paths.length) await supabase.storage.from(ENQUIRY_BUCKET).remove(paths);

  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) throw error;
}
