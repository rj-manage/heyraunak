// RJ Studio - enquiry pure helpers.
//
// Faithful TypeScript port of the original api/enquiry.js pure functions so the
// request/response contract and stored row shape are unchanged. Storage is
// still Google Sheets in Phase 1; Phase 3 makes Postgres the source of truth.
// Pure (no I/O) on purpose, so it is unit-testable.

import { createHash } from "node:crypto";

export const MAX_BODY_BYTES = 32 * 1024;
export const MAX_TEXT = 2000;
export const MAX_SHORT = 200;
export const MAX_DETAIL_KEYS = 40;
export const RATE_WINDOW_MS = 10 * 60 * 1000;
export const RATE_MAX = 6;
export const MIN_FILL_MS = 2000;
export const SHEET_TIMEOUT_MS = 15000;
export const MIN_SECRET_LENGTH = 16;

export const HEADERS = [
  "Enquiry ID",
  "Submission Date & Time",
  "Client Name",
  "Email Address",
  "Phone Number",
  "Country",
  "Service Category",
  "Selected Service",
  "Project Requirements",
  "Selected Platforms",
  "Project Budget (USD)",
  "Advertising Budget (USD)",
  "Expected Timeline",
  "Additional Message",
  "Enquiry Status",
  "Additional Details (JSON)"
] as const;

export const CONTACT_LABELS = {
  fullName: "Full Name",
  company: "Business / Company Name",
  email: "Email Address",
  phone: "Phone / WhatsApp Number",
  country: "Country",
  message: "Additional Message"
} as const;

export interface EnquiryInput {
  category?: unknown;
  service?: unknown;
  service_id?: unknown;
  idempotency_key?: unknown;
  form_started_at?: unknown;
  hp?: unknown;
  timeline?: unknown;
  budget_usd?: unknown;
  advertising_spend_usd?: unknown;
  platforms?: unknown;
  project_details?: Record<string, unknown>;
  contact?: Record<string, unknown>;
}

export interface EnquiryData {
  category: string;
  service: string;
  serviceId: string;
  idempotencyKey: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  message: string;
  timeline: string;
  budget: number | null;
  adSpend: number | null;
  platforms: string[];
  details: Record<string, string>;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Strip control characters, collapse whitespace and cap the length. */
export function clean(value: unknown, max: number): string {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Spreadsheet formula injection: prefix a leading = + - @ tab or CR. */
export function safeCell(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number") return value;
  const s = String(value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

export function round(value: unknown, min: number, max: number): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.round(n);
}

export function enquiryId(idempotencyKey: string, now: Date): string {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  const digest = createHash("sha256").update(String(idempotencyKey)).digest("hex").slice(0, 8).toUpperCase();
  return "RJ-" + day + "-" + digest;
}

export function stamp(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    now.getUTCFullYear() +
    "-" + p(now.getUTCMonth() + 1) +
    "-" + p(now.getUTCDate()) +
    " " + p(now.getUTCHours()) +
    ":" + p(now.getUTCMinutes()) +
    ":" + p(now.getUTCSeconds()) +
    " UTC"
  );
}

export function validate(body: EnquiryInput): { data: EnquiryData; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const contact = body.contact && typeof body.contact === "object" ? body.contact : {};
  const project =
    body.project_details && typeof body.project_details === "object" ? body.project_details : {};

  const data: EnquiryData = {
    category: clean(body.category, MAX_SHORT),
    service: clean(body.service, MAX_SHORT),
    serviceId: clean(body.service_id, MAX_SHORT),
    idempotencyKey: clean(body.idempotency_key, 80),
    fullName: clean(contact[CONTACT_LABELS.fullName], MAX_SHORT),
    company: clean(contact[CONTACT_LABELS.company], MAX_SHORT),
    email: clean(contact[CONTACT_LABELS.email], MAX_SHORT),
    phone: clean(contact[CONTACT_LABELS.phone], MAX_SHORT),
    country: clean(contact[CONTACT_LABELS.country], MAX_SHORT),
    message: clean(contact[CONTACT_LABELS.message], MAX_TEXT),
    timeline: clean(body.timeline, MAX_SHORT),
    budget: round(body.budget_usd, 10, 100000),
    adSpend: round(body.advertising_spend_usd, 10, 100000),
    platforms: [],
    details: {}
  };

  if (!data.category) errors.category = "missing";
  if (!data.service) errors.service = "missing";
  if (!data.fullName) errors.full_name = "required";
  if (!data.email || !isValidEmail(data.email)) errors.email = "invalid";
  if (!data.phone) errors.phone = "required";
  if (!data.country) errors.country = "required";
  if (!data.timeline) errors.timeline = "required";

  if (Array.isArray(body.platforms)) {
    data.platforms = body.platforms
      .slice(0, 10)
      .map((p) => clean(p, 40))
      .filter(Boolean);
  }

  const keys = Object.keys(project).slice(0, MAX_DETAIL_KEYS);
  for (const key of keys) {
    const value = project[key];
    const flat = Array.isArray(value)
      ? value.map((v) => clean(v, 120)).join(", ")
      : clean(value, 1500);
    if (!flat) continue;
    data.details[clean(key, MAX_SHORT)] = flat;
  }

  return { data, errors };
}

export function buildRow(data: EnquiryData, id: string, at: string): (string | number)[] {
  const requirements = Object.keys(data.details)
    .map((k) => k + ": " + data.details[k])
    .join("\n");

  return [
    safeCell(id),
    safeCell(at),
    safeCell(data.fullName),
    safeCell(data.email),
    safeCell(data.phone),
    safeCell(data.country),
    safeCell(data.category),
    safeCell(data.service),
    safeCell(requirements),
    safeCell(data.platforms.join(", ")),
    data.budget == null ? "" : data.budget,
    data.adSpend == null ? "" : data.adSpend,
    safeCell(data.timeline),
    safeCell(data.message),
    safeCell("New"),
    safeCell(JSON.stringify({ company: data.company, project_details: data.details }, null, 0))
  ];
}

export function money(n: number | null): string {
  return n == null ? "Not specified" : "$" + Number(n).toLocaleString("en-US") + " USD";
}

export function esc(v: unknown): string {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[c];
  });
}

function row(label: string, value: string): string {
  return (
    '<tr><td style="padding:8px 16px 8px 0;color:#5b6675;font-size:13px;white-space:nowrap;vertical-align:top">' +
    esc(label) +
    '</td><td style="padding:8px 0;color:#2a3444;font-size:14px;font-weight:600">' +
    (value || "\u2014") +
    "</td></tr>"
  );
}

export function adminHtml(d: EnquiryData, id: string, at: string): string {
  const details = Object.keys(d.details)
    .map((k) => row(k, esc(d.details[k])))
    .join("");
  return (
    '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#e3e9f0;padding:24px">' +
    '<div style="max-width:620px;margin:0 auto;background:#e3e9f0;border-radius:16px;padding:28px">' +
    '<p style="margin:0 0 6px;color:#156a47;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>' +
    '<h1 style="margin:0 0 4px;color:#2a3444;font-size:22px">New project enquiry</h1>' +
    '<p style="margin:0 0 20px;color:#5b6675;font-size:13px">' +
    esc(id) +
    " \u00b7 " +
    esc(at) +
    "</p>" +
    '<table style="width:100%;border-collapse:collapse">' +
    row("Client", esc(d.fullName)) +
    row("Email", esc(d.email)) +
    row("Phone", esc(d.phone)) +
    row("Country", esc(d.country)) +
    row("Category", esc(d.category)) +
    row("Service", esc(d.service)) +
    row("Platforms", esc(d.platforms.join(", "))) +
    row("Project budget", money(d.budget)) +
    (d.adSpend == null ? "" : row("Advertising budget", money(d.adSpend))) +
    row("Timeline", esc(d.timeline)) +
    "</table>" +
    (details
      ? '<h2 style="margin:24px 0 4px;color:#2a3444;font-size:15px">Project requirements</h2>' +
        '<table style="width:100%;border-collapse:collapse">' +
        details +
        "</table>"
      : "") +
    (d.message
      ? '<h2 style="margin:24px 0 4px;color:#2a3444;font-size:15px">Additional message</h2>' +
        '<p style="margin:0;color:#2a3444;font-size:14px;line-height:1.6">' +
        esc(d.message) +
        "</p>"
      : "") +
    "</div></div>"
  );
}

export function adminText(d: EnquiryData, id: string, at: string): string {
  const lines = [
    "New project enquiry - RJ Studio",
    "",
    "Enquiry ID: " + id,
    "Submitted: " + at,
    "Client: " + d.fullName,
    "Email: " + d.email,
    "Phone: " + d.phone,
    "Country: " + d.country,
    "Category: " + d.category,
    "Service: " + d.service,
    "Platforms: " + (d.platforms.join(", ") || "Not specified"),
    "Project budget: " + money(d.budget),
    "Advertising budget: " + money(d.adSpend),
    "Timeline: " + d.timeline,
    "",
    "Project requirements:"
  ];
  Object.keys(d.details).forEach((k) => lines.push("  " + k + ": " + d.details[k]));
  if (d.message) lines.push("", "Additional message:", "  " + d.message);
  return lines.join("\n");
}

export function ackHtml(): string {
  return (
    '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#e3e9f0;padding:24px">' +
    '<div style="max-width:560px;margin:0 auto;background:#e3e9f0;border-radius:16px;padding:28px">' +
    '<p style="margin:0 0 6px;color:#156a47;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>' +
    '<h1 style="margin:0 0 16px;color:#2a3444;font-size:22px">Thank you for reaching out</h1>' +
    '<p style="margin:0 0 12px;color:#2a3444;font-size:14px;line-height:1.6">' +
    "We've successfully received your project enquiry and appreciate your interest in working with us.</p>" +
    '<p style="margin:0 0 12px;color:#2a3444;font-size:14px;line-height:1.6">' +
    "Our team will review your requirements and get back to you.</p>" +
    '<p style="margin:20px 0 0;color:#5b6675;font-size:13px">Regards,<br />RJ Studio</p>' +
    "</div></div>"
  );
}

export const ACK_TEXT =
  "Thank you for reaching out to RJ Studio.\n\n" +
  "We've successfully received your project enquiry and appreciate your interest in working with us.\n\n" +
  "Our team will review your requirements and get back to you.\n\nRegards,\nRJ Studio";
