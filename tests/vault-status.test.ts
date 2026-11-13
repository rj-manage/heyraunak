import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  isClientAccessible,
  type HandoverStatus
} from "@/lib/vault/status";
import { createRateLimiter } from "@/lib/vault/rate-limit";

const NOW = new Date("2026-11-13T10:00:00Z");

describe("handover status", () => {
  it("derives expired from the expiry date, whatever the stored status", () => {
    expect(effectiveStatus({ status: "ready", expires_at: "2026-11-01T00:00:00Z" }, NOW)).toBe("expired");
    expect(effectiveStatus({ status: "accessed", expires_at: "2026-12-01T00:00:00Z" }, NOW)).toBe("accessed");
    expect(effectiveStatus({ status: "ready", expires_at: null }, NOW)).toBe("ready");
  });

  it("keeps revoked and explicit expiry sticky", () => {
    expect(effectiveStatus({ status: "revoked", expires_at: null }, NOW)).toBe("revoked");
    expect(effectiveStatus({ status: "expired", expires_at: "2030-01-01T00:00:00Z" }, NOW)).toBe("expired");
  });

  it("tolerates a Date instance and ignores an unparseable value", () => {
    expect(effectiveStatus({ status: "ready", expires_at: new Date("2026-11-12T00:00:00Z") }, NOW)).toBe("expired");
    expect(effectiveStatus({ status: "ready", expires_at: "not-a-date" }, NOW)).toBe("ready");
  });

  it("only lets a client open a live, released handover", () => {
    const allowed: HandoverStatus[] = ["ready", "accessed", "completed"];
    const denied: HandoverStatus[] = ["draft", "preparing", "expired", "revoked"];

    for (const status of allowed) {
      expect(isClientAccessible({ status, expires_at: null }, NOW)).toBe(true);
    }
    for (const status of denied) {
      expect(isClientAccessible({ status, expires_at: null }, NOW)).toBe(false);
    }
  });

  it("closes access once the expiry passes", () => {
    expect(isClientAccessible({ status: "ready", expires_at: "2026-11-13T09:59:59Z" }, NOW)).toBe(false);
    expect(isClientAccessible({ status: "ready", expires_at: "2026-11-13T10:00:01Z" }, NOW)).toBe(true);
  });

  it("never opens a revoked handover even with a future expiry", () => {
    expect(isClientAccessible({ status: "revoked", expires_at: "2030-01-01T00:00:00Z" }, NOW)).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit inside the window, then reports a retry delay", () => {
    let clock = 1_000_000;
    const check = createRateLimiter({ windowMs: 60_000, max: 3, now: () => clock });

    expect(check("ip").ok).toBe(true);
    expect(check("ip").ok).toBe(true);
    expect(check("ip").ok).toBe(true);

    const blocked = check("ip");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("frees capacity once the window slides past", () => {
    let clock = 1_000_000;
    const check = createRateLimiter({ windowMs: 1_000, max: 2, now: () => clock });
    expect(check("ip").ok).toBe(true);
    expect(check("ip").ok).toBe(true);
    expect(check("ip").ok).toBe(false);
    clock += 1_001;
    expect(check("ip").ok).toBe(true);
  });

  it("keys limits independently", () => {
    const check = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(check("a").ok).toBe(true);
    expect(check("a").ok).toBe(false);
    expect(check("b").ok).toBe(true);
  });
});
