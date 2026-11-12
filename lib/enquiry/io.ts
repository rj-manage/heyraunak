// RJ Studio - enquiry I/O (Google Apps Script storage + Resend email).
//
// Ported from api/enquiry.js. Storage stays Google Sheets until Phase 3, when
// Postgres becomes the source of truth and Sheets becomes an export mirror.

import { MIN_SECRET_LENGTH, SHEET_TIMEOUT_MS, adminHtml, adminText, ackHtml, ACK_TEXT } from "./core";
import type { EnquiryData } from "./core";

const RESEND_URL = "https://api.resend.com/emails";

export interface EnquiryConfig {
  scriptUrl: string;
  secret: string;
  adminEmail: string;
  emailKey: string;
  sender: string;
  ack: boolean;
  allowedOrigin: string;
}

function env(name: string): string {
  return (process.env[name] || "").trim();
}

export function config(): EnquiryConfig {
  return {
    scriptUrl: env("GOOGLE_APPS_SCRIPT_URL"),
    secret: env("RJ_ENQUIRY_SHARED_SECRET"),
    adminEmail: env("ADMIN_NOTIFICATION_EMAIL"),
    emailKey: env("EMAIL_PROVIDER_API_KEY"),
    sender: env("EMAIL_SENDER_ADDRESS"),
    ack: env("CUSTOMER_ACK_ENABLED").toLowerCase() === "true",
    allowedOrigin: env("ENQUIRY_ALLOWED_ORIGIN")
  };
}

export function sheetConfigured(cfg: EnquiryConfig): boolean {
  return /^https:\/\/script\.google\.com\//.test(cfg.scriptUrl) && cfg.secret.length >= MIN_SECRET_LENGTH;
}

// Email is a courtesy, storage is the promise: a missing provider must never
// stop an enquiry being saved.
export function emailConfigured(cfg: EnquiryConfig): boolean {
  return !!(cfg.adminEmail && cfg.emailKey && cfg.sender);
}

export interface SheetSaveResult {
  duplicate: boolean;
  enquiryId: string;
}

export async function saveToSheet(
  cfg: EnquiryConfig,
  row: (string | number)[],
  id: string
): Promise<SheetSaveResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SHEET_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(cfg.scriptUrl, {
      method: "POST",
      redirect: "follow",
      // text/plain keeps the body a plain string and avoids any preflight;
      // Apps Script reads it from e.postData.contents
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ auth: cfg.secret, enquiryId: id, row }),
      signal: controller.signal
    });
  } catch {
    throw new Error("apps_script_unreachable");
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text().catch(() => "");

  let payload: { success?: boolean; saved?: boolean; duplicate?: boolean; enquiryId?: string } | null = null;
  try {
    payload = JSON.parse(text);
  } catch {
    // redirect to a login page, an HTML error, or an empty body
    throw new Error("apps_script_bad_response");
  }

  if (!payload || payload.success !== true || payload.saved !== true) {
    throw new Error("apps_script_rejected");
  }

  return { duplicate: payload.duplicate === true, enquiryId: payload.enquiryId || id };
}

interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
}

export async function sendEmail(cfg: EnquiryConfig, payload: EmailPayload): Promise<unknown> {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + cfg.emailKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("email_" + res.status);
  return res.json().catch(() => ({}));
}

export interface NotifyState {
  email: "disabled" | "sent" | "failed";
  ack: "disabled" | "sent" | "failed";
}

// Never fatal: the row is already saved by the time this runs.
export async function notify(cfg: EnquiryConfig, data: EnquiryData, id: string, at: string): Promise<NotifyState> {
  const state: NotifyState = { email: "disabled", ack: "disabled" };

  if (emailConfigured(cfg)) {
    state.email = "sent";
    try {
      await sendEmail(cfg, {
        from: cfg.sender,
        to: [cfg.adminEmail],
        subject: "New Project Enquiry Received - RJ Studio",
        html: adminHtml(data, id, at),
        text: adminText(data, id, at),
        reply_to: data.email
      });
    } catch (err) {
      state.email = "failed";
      console.error("enquiry: admin email failed for " + id + " -", (err as Error)?.message);
    }
  } else {
    console.warn("enquiry: email not configured - saved " + id + " without a notification");
  }

  if (cfg.ack && emailConfigured(cfg)) {
    try {
      await sendEmail(cfg, {
        from: cfg.sender,
        to: [data.email],
        subject: "We Received Your Project Enquiry - RJ Studio",
        html: ackHtml(),
        text: ACK_TEXT
      });
      state.ack = "sent";
    } catch (err) {
      state.ack = "failed";
      console.error("enquiry: client ack failed for " + id + " -", (err as Error)?.message);
    }
  }

  return state;
}
