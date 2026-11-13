import { GENERIC_ERROR, fail, json, sameOrigin, tooMany, BUSY_ERROR, vaultReady, notConfigured } from "@/lib/vault/http";
import { fieldErrors, verifyCodeSchema } from "@/lib/vault/validation";
import { createRateLimiter } from "@/lib/vault/rate-limit";
import {
  clearFailedCodeAttempts,
  countRecentOtpRequests,
  findHandoverByCode,
  issueOtp,
  secondsSinceLastOtp
} from "@/lib/vault/service";
import { isClientAccessible } from "@/lib/vault/status";
import { clientIpFrom, recordVaultEvent } from "@/lib/vault/audit";
import { emailConfigured, sendTransactional } from "@/lib/email/send";
import { otpEmail } from "@/lib/email/vault-templates";
import { OTP_MAX_PER_HOUR, OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_MINUTES } from "@/lib/vault/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(request: Request): Promise<Response> {
  if (!vaultReady()) return notConfigured();
  if (!sameOrigin(request)) return fail(403);

  const ip = clientIpFrom(request.headers);
  const rl = limiter(`code:${ip ?? "anon"}`);
  if (!rl.ok) return tooMany(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400);
  }

  const parsed = verifyCodeSchema.safeParse(body);
  if (!parsed.success) return fail(400, GENERIC_ERROR, { fields: fieldErrors(parsed.error) });

  const { handover } = await findHandoverByCode(parsed.data.code);

  // generic: an unknown code and an unavailable handover look identical
  if (!handover) return fail(400);
  if (!isClientAccessible(handover)) {
    await recordVaultEvent({ handoverId: handover.id, type: "code_fail", metadata: { reason: "not_accessible" }, ip });
    return fail(400);
  }

  await clearFailedCodeAttempts(handover.id);

  const last = await secondsSinceLastOtp(handover.id);
  if (last !== null && last < OTP_RESEND_COOLDOWN_SECONDS) {
    return json(
      { ok: false, message: BUSY_ERROR, retryAfter: OTP_RESEND_COOLDOWN_SECONDS - last },
      429
    );
  }
  if ((await countRecentOtpRequests(handover.id, 60)) >= OTP_MAX_PER_HOUR) return tooMany(300);

  const issued = await issueOtp(handover);
  await recordVaultEvent({ handoverId: handover.id, type: "otp_requested", ip });
  await recordVaultEvent({ handoverId: handover.id, type: "code_ok", ip });

  if (!emailConfigured()) {
    return fail(503, "Email is not configured, so we could not send your verification code.");
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
    return fail(502, "We couldn't send the verification email. Please try again shortly.");
  }

  return json({
    ok: true,
    issueToken: issued.issueToken,
    maskedEmail: issued.maskedEmail,
    expiresInMinutes: OTP_TTL_MINUTES
  });
}
