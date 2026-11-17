// Shared transactional email sender (Resend).
//
// Used by Project Vault. Env-driven; never logs message bodies.

const RESEND_URL = "https://api.resend.com/emails";

export interface TransactionalEmail {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** override for callers that already resolved config (e.g. the enquiry form) */
  apiKey?: string;
  from?: string;
}

export interface SendResult {
  ok: boolean;
  status: number;
}

function env(name: string): string {
  return (process.env[name] || "").trim();
}

export function emailConfigured(): boolean {
  return !!(env("ADMIN_NOTIFICATION_EMAIL") && env("EMAIL_PROVIDER_API_KEY") && env("EMAIL_SENDER_ADDRESS"));
}

/** Wraps a body fragment in a well-formed HTML document (helps inbox placement). */
function asDocument(html: string): string {
  if (/^\s*<!doctype html/i.test(html)) return html;
  return (
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<meta name=\"color-scheme\" content=\"light\">" +
    "</head><body style=\"margin:0;padding:0\">" + html + "</body></html>"
  );
}

/** Ensures the From always carries a display name ("RJ Studio <addr>"). */
function asFrom(from: string): string {
  if (!from || from.includes("<")) return from;
  return `RJ Studio <${from}>`;
}

/** Sends one transactional email. Returns a result; never throws for HTTP errors. */
export async function sendTransactional(msg: TransactionalEmail): Promise<SendResult> {
  const apiKey = msg.apiKey || env("EMAIL_PROVIDER_API_KEY");
  const from = asFrom(msg.from || env("EMAIL_SENDER_ADDRESS"));
  const replyTo = msg.replyTo || env("EMAIL_REPLY_TO") || env("ADMIN_NOTIFICATION_EMAIL");

  if (!apiKey || !from) return { ok: false, status: 0 };

  const body: Record<string, unknown> = {
    from,
    to: msg.to,
    subject: msg.subject,
    html: asDocument(msg.html),
    text: msg.text
  };
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return { ok: res.ok, status: res.status };
}
