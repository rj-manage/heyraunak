import { createHmac, randomBytes } from "node:crypto";
import { vaultSecret } from "./secret";

// 32 characters, chosen so 256 % 32 === 0: one random byte maps uniformly to one
// character with no modulo bias. Ambiguous glyphs (I, O, 0, 1) are excluded so
// codes can be read aloud and retyped safely.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GROUPS = 3;
const GROUP_LEN = 4;
export const CODE_LENGTH = GROUPS * GROUP_LEN; // 12 characters => 60 bits

/**
 * Uppercase, drop every non-alphanumeric character, then remove the decorative
 * "RJ" prefix so the remaining value is always the 12-character payload. A code
 * typed with or without the prefix normalises to the same thing.
 */
export function normalizeCode(input: string): string {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^RJ/, "");
}

/** `RJ-XXXX-XXXX-XXXX` from a CSPRNG. Never derived from ids or timestamps. */
export function generateAccessCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g++) groups.push(out.slice(g * GROUP_LEN, (g + 1) * GROUP_LEN));
  return "RJ-" + groups.join("-");
}

export function isWellFormedCode(input: string): boolean {
  const c = normalizeCode(input);
  if (c.length !== CODE_LENGTH) return false;
  for (const ch of c) if (!ALPHABET.includes(ch)) return false;
  return true;
}

/** HMAC-SHA256 of the normalised code. The plaintext code is never stored. */
export function hashAccessCode(input: string): string {
  return createHmac("sha256", vaultSecret()).update("code:" + normalizeCode(input)).digest("hex");
}

/**
 * Masked address for display, e.g. `a***@example.com`. The domain is shown so
 * the client can recognise their own mailbox; the local part is not.
 */
export function maskEmail(email: string): string {
  const value = String(email || "").trim();
  const at = value.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const head = local.slice(0, 1);
  return head + "***@" + domain;
}
