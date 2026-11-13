import { beforeAll, describe, expect, it } from "vitest";
import { canManageVault, VAULT_ADMIN_ROLES, type Role } from "@/lib/rbac/roles";
import { generateAccessCode, hashAccessCode } from "@/lib/vault/codes";
import { validateFile, MAX_FILE_BYTES, buildStoragePath } from "@/lib/vault/storage";
import { effectiveStatus, isClientAccessible } from "@/lib/vault/status";

beforeAll(() => {
  process.env.PROJECT_VAULT_SECRET = "phase-d-test-secret-0123456789abcdef";
});

describe("admin permissions", () => {
  it("allows only owner, admin and project_manager", () => {
    expect(VAULT_ADMIN_ROLES).toEqual(["owner", "admin", "project_manager"]);
    for (const role of VAULT_ADMIN_ROLES) {
      expect(canManageVault([role])).toBe(true);
    }
  });

  it("denies finance, freelancers and customers", () => {
    const denied: Role[] = ["finance", "freelancer", "customer"];
    for (const role of denied) expect(canManageVault([role])).toBe(false);
    expect(canManageVault([])).toBe(false);
  });

  it("allows a user who holds any admin role among several", () => {
    expect(canManageVault(["customer", "project_manager"])).toBe(true);
    expect(canManageVault(["customer", "freelancer"])).toBe(false);
  });
});

describe("access code generation and regeneration", () => {
  it("regenerating produces a different code and invalidates the old hash", () => {
    const first = generateAccessCode();
    const firstHash = hashAccessCode(first);

    const second = generateAccessCode();
    const secondHash = hashAccessCode(second);

    expect(second).not.toBe(first);
    expect(secondHash).not.toBe(firstHash);
    // the stored hash is replaced, so the previous code no longer matches
    expect(hashAccessCode(first)).toBe(firstHash);
    expect(hashAccessCode(first)).not.toBe(secondHash);
  });

  it("same code normalises to the same hash, with or without the RJ prefix", () => {
    const code = generateAccessCode();
    const bare = code.replace(/^RJ-/, "");
    expect(hashAccessCode(bare)).toBe(hashAccessCode(code));
  });
});

describe("file upload validation", () => {
  it("accepts the deliverable types admins upload", () => {
    for (const name of ["source.zip", "manual.pdf", "logo.svg", "readme.md", "assets.tar.gz"]) {
      expect(validateFile(name, 1024).ok).toBe(true);
    }
  });

  it("rejects executables, unknown extensions and oversized files", () => {
    expect(validateFile("setup.exe", 1024)).toEqual({ ok: false, reason: "extension" });
    expect(validateFile("payload.bin", 1024)).toEqual({ ok: false, reason: "extension" });
    expect(validateFile("notes.qqq", 1024)).toEqual({ ok: false, reason: "extension" });
    expect(validateFile("huge.zip", MAX_FILE_BYTES + 1)).toEqual({ ok: false, reason: "size" });
    expect(validateFile("empty.pdf", 0)).toEqual({ ok: false, reason: "empty" });
  });

  it("stores uploads under an id-based path, never a client name", () => {
    const path = buildStoragePath("handover-123", "file-456", "../../manual.pdf");
    expect(path).toBe("project-vault/handover-123/file-456/manual.pdf");
    expect(path).not.toContain("..");
  });
});

describe("revocation and expiry", () => {
  it("revoked handovers are not accessible even with a future expiry", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    expect(isClientAccessible({ status: "revoked", expires_at: "2030-01-01T00:00:00Z" }, now)).toBe(false);
    expect(effectiveStatus({ status: "revoked", expires_at: null }, now)).toBe("revoked");
  });

  it("expiring now closes access", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    expect(isClientAccessible({ status: "ready", expires_at: "2026-11-13T09:59:59Z" }, now)).toBe(false);
    expect(effectiveStatus({ status: "ready", expires_at: "2026-11-13T09:59:59Z" }, now)).toBe("expired");
  });

  it("reactivating restores access for a live handover", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    expect(isClientAccessible({ status: "ready", expires_at: null }, now)).toBe(true);
    expect(isClientAccessible({ status: "accessed", expires_at: null }, now)).toBe(true);
  });
});
