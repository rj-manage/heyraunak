import { describe, it, expect } from "vitest";
import { buildUpdateMessages, STATUS_LABEL } from "@/lib/enquiries/update-messages";
import type { EnquiryStatus } from "@/lib/enquiries/validation";

const ctx = { name: "Ada Lovelace", ref: "RJ-20260101-ABCD1234", service: "Business Website Development" };
const ALL = Object.keys(STATUS_LABEL) as EnquiryStatus[];

describe("enquiry update messages", () => {
  it("produces a complete message for every status", () => {
    for (const status of ALL) {
      const m = buildUpdateMessages(status, ctx);
      expect(m.line.length, status).toBeGreaterThan(0);
      expect(m.subject).toContain(ctx.ref);
      expect(m.emailText).toContain(ctx.ref);
      expect(m.emailText).toContain(ctx.service);
      expect(m.emailHtml).toContain(ctx.ref);
      expect(m.whatsapp).toContain(ctx.ref);
    }
  });

  it("changes the copy with the status", () => {
    const a = buildUpdateMessages("qualified", ctx);
    const b = buildUpdateMessages("cancelled", ctx);
    expect(a.line).not.toBe(b.line);
    expect(a.whatsapp).not.toBe(b.whatsapp);
    expect(a.subject).not.toBe(b.subject);
  });

  it("greets by name, falling back to a neutral greeting", () => {
    expect(buildUpdateMessages("submitted", ctx).emailText).toContain("Hi Ada Lovelace,");
    expect(buildUpdateMessages("submitted", { ...ctx, name: "" }).emailText).toContain("Hello,");
  });

  it("escapes the customer name in the email HTML", () => {
    const m = buildUpdateMessages("submitted", { ...ctx, name: "<script>" });
    expect(m.emailHtml).not.toContain("<script>");
    expect(m.emailHtml).toContain("&lt;script&gt;");
  });
});
