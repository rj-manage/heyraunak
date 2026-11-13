// Shared transactional email sender (Resend).
//
// Extracted from lib/enquiry/io.ts so Project Vault and the enquiry form use one
// implementation. Env-driven; never logs message bodies.

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

/** Sends one transactional email. Returns a result; never throws for HTTP errors. */
export async function sendTransactional(msg: TransactionalEmail): Promise<SendResult> {
  const apiKey = msg.apiKey || env("EMAIL_PROVIDER_API_KEY");
  const from = msg.from || env("EMAIL_SENDER_ADDRESS");

  if (!apiKey || !from) return { ok: false, status: 0 };

  const body: Record<string, unknown> = {
    from,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text
  };
  if (msg.replyTo) body.reply_to = msg.replyTo;

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
