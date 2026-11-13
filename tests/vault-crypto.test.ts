import { beforeAll, describe, expect, it } from "vitest";
import {
  CODE_LENGTH,
  generateAccessCode,
  hashAccessCode,
  isWellFormedCode,
  maskEmail,
  normalizeCode
} from "@/lib/vault/codes";
import {
  OTP_TTL_MINUTES,
  generateIssueToken,
  generateOtp,
  hashIssueToken,
  hashOtp,
  isWellFormedOtp,
  otpExpiryFrom
} from "@/lib/vault/otp";
import {
  SESSION_IDLE_MINUTES,
  generateSessionToken,
  hashSessionToken,
  sessionCookieOptions
} from "@/lib/vault/session";

beforeAll(() => {
  process.env.PROJECT_VAULT_SECRET = "unit-test-secret-0123456789abcdefghijkl";
});

describe("access codes", () => {
  it("formats as RJ-XXXX-XXXX-XXXX with unambiguous characters only", () => {
    const code = generateAccessCode();
    expect(code).toMatch(/^RJ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(normalizeCode(code)).toHaveLength(CODE_LENGTH);
    expect(code.slice(3).replace(/-/g, "")).not.toMatch(/[IO01]/);
  });

  it("is not sequential or time-derived", () => {
    const a = generateAccessCode();
    const b = generateAccessCode();
    expect(a).not.toBe(b);
    expect(normalizeCode(a)).not.toBe(normalizeCode(b));
  });

  it("produces unique codes across many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(generateAccessCode());
    expect(seen.size).toBe(500);
  });

  it("normalises typed input", () => {
    expect(normalizeCode("rj-abcd-efgh-jklm")).toBe("ABCDEFGHJKLM");
    expect(normalizeCode("  RJ AB CD EF GH JK LM ")).toBe("ABCDEFGHJKLM");
    expect(normalizeCode("rj-abcd-efgh-jklm!")).toBe("ABCDEFGHJKLM");
  });

  it("validates well-formedness", () => {
    expect(isWellFormedCode(generateAccessCode())).toBe(true);
    expect(isWellFormedCode("RJ-ABCD-EFGH-JKLM")).toBe(true);
    expect(isWellFormedCode("RJ-ABCD-EFGH")).toBe(false);
    expect(isWellFormedCode("RJ-ABCD-EFGH-JKLI")).toBe(false); // I is not in the alphabet
  });

  it("stores only an HMAC, never the code", () => {
    const code = generateAccessCode();
    const hash = hashAccessCode(code);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(normalizeCode(code));
    expect(hash).toBe(hashAccessCode(code));
    expect(hash).toBe(hashAccessCode(normalizeCode(code)));
    expect(hash).not.toBe(hashAccessCode(generateAccessCode()));
  });

  it("changes with the server secret", () => {
    const code = "RJ-ABCD-EFGH-JKLM";
    const first = hashAccessCode(code);
    process.env.PROJECT_VAULT_SECRET = "a-completely-different-secret-0123456789";
    const second = hashAccessCode(code);
    process.env.PROJECT_VAULT_SECRET = "unit-test-secret-0123456789abcdefghijkl";
    expect(second).not.toBe(first);
  });

  it("throws when the secret is missing or too short", () => {
    const saved = process.env.PROJECT_VAULT_SECRET;
    process.env.PROJECT_VAULT_SECRET = "short";
    expect(() => hashAccessCode("RJ-ABCD-EFGH-JKLM")).toThrow();
    process.env.PROJECT_VAULT_SECRET = saved;
  });
});

describe("maskEmail", () => {
  it("hides the local part but keeps the domain", () => {
    expect(maskEmail("ada@example.com")).toBe("a***@example.com");
    expect(maskEmail("client.long.name@sub.domain.co.uk")).toBe("c***@sub.domain.co.uk");
  });
  it("falls back safely for malformed input", () => {
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("")).toBe("***");
  });
});

describe("otp", () => {
  it("is six digits", () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^[0-9]{6}$/);
      expect(isWellFormedOtp(otp)).toBe(true);
    }
    expect(isWellFormedOtp("12345")).toBe(false);
    expect(isWellFormedOtp("1234567")).toBe(false);
    expect(isWellFormedOtp("12a456")).toBe(false);
  });

  it("binds the hash to the handover and to this issue", () => {
    const base = hashOtp("h1", "123456", "issue-1");
    expect(base).toMatch(/^[0-9a-f]{64}$/);
    expect(hashOtp("h1", "123456", "issue-1")).toBe(base);
    expect(hashOtp("h2", "123456", "issue-1")).not.toBe(base);
    expect(hashOtp("h1", "654321", "issue-1")).not.toBe(base);
    // a re-issued OTP cannot be replayed against the old hash
    expect(hashOtp("h1", "123456", "issue-2")).not.toBe(base);
  });

  it("never contains the digits", () => {
    expect(hashOtp("h1", "123456", "issue-1")).not.toContain("123456");
  });

  it("expires after the configured window", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    expect(otpExpiryFrom(now).toISOString()).toBe("2026-11-13T10:10:00.000Z");
    expect(OTP_TTL_MINUTES).toBe(10);
  });
});

describe("issue token", () => {
  it("is random and stored only as a hash", () => {
    const a = generateIssueToken();
    const b = generateIssueToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(20);
    const hash = hashIssueToken(a);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashIssueToken(a));
    expect(hash).not.toBe(hashIssueToken(b));
  });
});

describe("session tokens", () => {
  it("are random, hashed, and flagged correctly on the cookie", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);

    const hash = hashSessionToken(a);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(a);
    expect(hash).toBe(hashSessionToken(a));

    const opts = sessionCookieOptions(SESSION_IDLE_MINUTES * 60);
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(SESSION_IDLE_MINUTES * 60);
  });
});
