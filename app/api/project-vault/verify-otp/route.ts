import { GENERIC_ERROR, fail, json, sameOrigin, tooMany } from "@/lib/vault/http";
import { fieldErrors, verifyOtpSchema } from "@/lib/vault/validation";
import { createRateLimiter } from "@/lib/vault/rate-limit";
import { verifyOtp } from "@/lib/vault/service";
import { clientIpFrom } from "@/lib/vault/audit";
import { setSessionCookie } from "@/lib/vault/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return fail(403);

  const ip = clientIpFrom(request.headers);
  const rl = limiter(`verify:${ip ?? "anon"}`);
  if (!rl.ok) return tooMany(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400);
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) return fail(400, GENERIC_ERROR, { fields: fieldErrors(parsed.error) });

  const result = await verifyOtp(parsed.data.issueToken, parsed.data.otp, {
    ip,
    userAgent: request.headers.get("user-agent")
  });

  if (!result.ok) {
    if (result.reason === "too_many") {
      return fail(400, "That code has been tried too many times. Request a new one.");
    }
    if (result.reason === "expired") {
      return fail(400, "That code has expired. Request a new one.");
    }
    return fail(400);
  }

  await setSessionCookie(result.sessionToken);

  return json({ ok: true });
}
