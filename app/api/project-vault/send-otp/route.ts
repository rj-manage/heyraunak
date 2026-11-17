import { BUSY_ERROR, GENERIC_ERROR, fail, json, sameOrigin, tooMany, vaultReady, notConfigured } from "@/lib/vault/http";
import { fieldErrors, sendOtpSchema } from "@/lib/vault/validation";
import { createRateLimiter } from "@/lib/vault/rate-limit";
import {
  countRecentOtpRequests,
  issueOtp,
  resolveIssueToken,
  secondsSinceLastOtp
} from "@/lib/vault/service";
import { clientIpFrom, recordVaultEvent } from "@/lib/vault/audit";
import { emailConfigured, sendTransactional } from "@/lib/email/send";
import { otpEmail } from "@/lib/email/vault-templates";
import { OTP_MAX_PER_HOUR, OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_MINUTES } from "@/lib/vault/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });

export async function POST(request: Request): Promise<Response> {
  if (!vaultReady()) return notConfigured();
  if (!sameOrigin(request)) return fail(403);

  const ip = clientIpFrom(request.headers);
  const rl = limiter(`otp:${ip ?? "anon"}`);
  if (!rl.ok) return tooMany(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400);
  }

  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) return fail(400, GENERIC_ERROR, { fields: fieldErrors(parsed.error) });

  const handover = await resolveIssueToken(parsed.data.issueToken);
  if (!handover) return fail(400);

  const last = await secondsSinceLastOtp(handover.id);
  if (last !== null && last < OTP_RESEND_COOLDOWN_SECONDS) {
    return json({ ok: false, message: BUSY_ERROR, retryAfter: OTP_RESEND_COOLDOWN_SECONDS - last }, 429);
  }
  if ((await countRecentOtpRequests(handover.id, 60)) >= OTP_MAX_PER_HOUR) return tooMany(300);

  const issued = await issueOtp(handover);
  await recordVaultEvent({ handoverId: handover.id, type: "otp_requested", metadata: { resend: true }, ip });

  if (!emailConfigured()) {
    return fail(503, "Email is not configured, so we could not resend your code.");
  }

  const mail = otpEmail({ otp: issued.otp, minutes: OTP_TTL_MINUTES });
  const sent = await sendTransactional({
    to: [handover.client_email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text
  });

  if (!sent.ok) {
    await recordVaultEvent({ handoverId: handover.id, type: "email_failed", ip });
    return fail(502, "We couldn't resend the email. Please try again shortly.");
  }

  return json({
    ok: true,
    issueToken: issued.issueToken,
    maskedEmail: issued.maskedEmail,
    expiresInMinutes: OTP_TTL_MINUTES
  });
}
