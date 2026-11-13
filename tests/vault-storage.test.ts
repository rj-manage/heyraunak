import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  buildStoragePath,
  extensionOf,
  humanFileSize,
  sanitizeFilename,
  validateFile
} from "@/lib/vault/storage";
import {
  createHandoverSchema,
  fieldErrors,
  fileMetadataSchema,
  verifyCodeSchema,
  verifyOtpSchema
} from "@/lib/vault/validation";

describe("sanitizeFilename", () => {
  it("strips directories and traversal", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("/var/tmp/report.pdf")).toBe("report.pdf");
    expect(sanitizeFilename("..\\..\\windows\\system32\\cmd.exe")).toBe("cmd.exe");
    expect(sanitizeFilename("a/b/c/file.zip")).toBe("file.zip");
  });

  it("removes control characters, separators and leading dots", () => {
    expect(sanitizeFilename("bad\u0000name\u001f.txt")).toBe("badname.txt");
    expect(sanitizeFilename("we:ird|name?.png")).toBe("we-ird-name-.png");
    expect(sanitizeFilename("....hidden.md")).toBe("hidden.md");
    expect(sanitizeFilename("a....b.txt")).toBe("a.b.txt");
  });

  it("never returns an empty name and caps the length", () => {
    expect(sanitizeFilename("")).toBe("file");
    expect(sanitizeFilename("...")).toBe("file");
    expect(sanitizeFilename("/")).toBe("file");

    const long = sanitizeFilename("x".repeat(400) + ".pdf");
    expect(long.length).toBeLessThanOrEqual(120);
    expect(long.endsWith(".pdf")).toBe(true);
  });
});

describe("extensionOf / validateFile", () => {
  it("reads the extension", () => {
    expect(extensionOf("Report.PDF")).toBe("pdf");
    expect(extensionOf("archive.tar.gz")).toBe("gz");
    expect(extensionOf("noext")).toBe("");
    expect(extensionOf("trailing.")).toBe("");
  });

  it("accepts supported deliverables", () => {
    expect(validateFile("site.zip", 10 * 1024 * 1024).ok).toBe(true);
    expect(validateFile("manual.pdf", 1024).ok).toBe(true);
    expect(validateFile("logo.svg", 2048).ok).toBe(true);
    expect(validateFile("notes.md", 10).ok).toBe(true);
  });

  it("rejects blocked, unknown and oversized files", () => {
    expect(validateFile("payload.exe", 10)).toEqual({ ok: false, reason: "extension" });
    expect(validateFile("library.dll", 10)).toEqual({ ok: false, reason: "extension" });
    expect(validateFile("mystery.xyzzy", 10)).toEqual({ ok: false, reason: "extension" });
    expect(validateFile("noextension", 10)).toEqual({ ok: false, reason: "extension" });
    expect(validateFile("big.zip", MAX_FILE_BYTES + 1)).toEqual({ ok: false, reason: "size" });
    expect(validateFile("empty.zip", 0)).toEqual({ ok: false, reason: "empty" });
  });
});

describe("buildStoragePath", () => {
  it("is id-based, never client-derived, and keeps traversal out", () => {
    const path = buildStoragePath("11111111-1111-1111-1111-111111111111", "file-1", "../../secret.zip");
    expect(path).toBe("project-vault/11111111-1111-1111-1111-111111111111/file-1/secret.zip");
    expect(path).not.toContain("..");
  });
});

describe("humanFileSize", () => {
  it("formats sizes", () => {
    expect(humanFileSize(512)).toBe("512 B");
    expect(humanFileSize(2048)).toBe("2.0 KB");
    expect(humanFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(humanFileSize(null)).toBe("-");
  });
});

describe("validation", () => {
  it("accepts a reasonable access code and rejects junk", () => {
    expect(verifyCodeSchema.safeParse({ code: "RJ-ABCD-EFGH-JKLM" }).success).toBe(true);
    expect(verifyCodeSchema.safeParse({ code: "" }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ code: "x".repeat(100) }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({}).success).toBe(false);
  });

  it("requires a 6-digit OTP and an issue token", () => {
    const token = "t".repeat(24);
    expect(verifyOtpSchema.safeParse({ issueToken: token, otp: "123456" }).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ issueToken: token, otp: "12345" }).success).toBe(false);
    expect(verifyOtpSchema.safeParse({ issueToken: token, otp: "abcdef" }).success).toBe(false);
    expect(verifyOtpSchema.safeParse({ issueToken: "short", otp: "123456" }).success).toBe(false);
  });

  it("validates handover creation and defaults the status", () => {
    const parsed = createHandoverSchema.safeParse({
      clientName: "Ada Lovelace",
      clientEmail: "ada@example.com",
      projectName: "Business Website"
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("draft");
      expect(parsed.data.generateCode).toBe(true);
    }

    expect(
      createHandoverSchema.safeParse({ clientName: "A", clientEmail: "nope", projectName: "P" }).success
    ).toBe(false);
    expect(
      createHandoverSchema.safeParse({
        clientName: "A",
        clientEmail: "a@b.co",
        projectName: "P",
        deliveryDate: "13-11-2026"
      }).success
    ).toBe(false);
  });

  it("validates file metadata", () => {
    expect(fileMetadataSchema.safeParse({ category: "documentation", isVisible: false }).success).toBe(true);
    expect(fileMetadataSchema.safeParse({ category: "nope" }).success).toBe(false);
  });

  it("flattens errors into a field map", () => {
    const result = createHandoverSchema.safeParse({ clientName: "", clientEmail: "bad", projectName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.clientEmail).toBeDefined();
      expect(errors.clientName).toBeDefined();
      expect(errors.projectName).toBeDefined();
    }
  });
});
