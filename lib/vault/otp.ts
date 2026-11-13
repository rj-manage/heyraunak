import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { vaultSecret } from "./secret";

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_PER_HOUR = 5;

/** Uniform 6-digit code (randomInt is unbiased). Never logged. */
export function generateOtp(): string {
  let out = "";
  for (let i = 0; i < OTP_LENGTH; i++) out += String(randomInt(0, 10));
  return out;
}

/**
 * The OTP is bound to the handover AND to this issue, so an older OTP cannot be
 * replayed once a new one is issued.
 */
export function hashOtp(handoverId: string, otp: string, issueId: string): string {
  return createHmac("sha256", vaultSecret())
    .update(`otp:${handoverId}:${issueId}:${otp}`)
    .digest("hex");
}

export function isWellFormedOtp(input: string): boolean {
  return /^[0-9]{6}$/.test(String(input || "").trim());
}

export function otpExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Opaque handle returned to the browser after a valid access code. It resolves
 * to the OTP row (and therefore the handover) without exposing any internal id.
 */
export function generateIssueToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashIssueToken(token: string): string {
  return createHash("sha256").update("issue:" + token).digest("hex");
}
