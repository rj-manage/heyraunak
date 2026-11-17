// POST /api/auth/send-link
//
// Generates a Supabase email OTP server-side and mails it from our own verified
// sender (heyraunak.site) instead of Supabase's default mailer, which is the
// usual reason sign-in codes land in spam. The browser still verifies the code
// with supabase.auth.verifyOtp({ type: "email" }).

import { json, sameOrigin } from "@/lib/vault/http";
import { createRateLimiter } from "@/lib/vault/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTransactional } from "@/lib/email/send";
import { signInEmail } from "@/lib/email/auth-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_MINUTES = 60;
const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });

// Same answer whether or not the address exists, so the endpoint can't be used
// to probe for accounts.
const GENERIC_OK = { ok: true, message: "If that email can sign in, we've sent it a code." };

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false }, 403);

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const rl = limiter("auth:" + ip);
  if (!rl.ok) {
    return json({ ok: false, message: "Too many requests. Please wait a moment and try again." }, 429);
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return json({ ok: false, message: "Enter a valid email address." }, 400);

  let code = "";
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data?.properties?.email_otp) {
      console.warn("auth: sign-in link skipped -", error?.message || "no otp returned");
      return json(GENERIC_OK);
    }
    code = data.properties.email_otp;
  } catch (err) {
    console.error("auth: sign-in link failed -", (err as Error)?.message);
    return json(GENERIC_OK);
  }

  const mail = signInEmail({ code, minutes: OTP_TTL_MINUTES });
  const sent = await sendTransactional({
    to: [email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text
  });
  if (!sent.ok) {
    console.error("auth: sign-in email failed - status " + sent.status);
    return json({ ok: false, message: "We couldn't send the email right now. Please try again." }, 502);
  }

  return json(GENERIC_OK);
}
