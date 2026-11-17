import { describe, it, expect } from "vitest";
import { signInEmail } from "@/lib/email/auth-templates";

describe("sign-in email", () => {
  it("includes the code and expiry in the subject, html and text", () => {
    const m = signInEmail({ code: "123456", minutes: 60 });
    expect(m.subject).toContain("sign-in code");
    expect(m.html).toContain("123456");
    expect(m.text).toContain("123456");
    expect(m.text).toContain("60 minutes");
    expect(m.html).toContain("60 minutes");
  });

  it("escapes the code in the HTML", () => {
    const m = signInEmail({ code: "<b>1</b>", minutes: 10 });
    expect(m.html).not.toContain("<b>1</b>");
    expect(m.html).toContain("&lt;b&gt;1&lt;/b&gt;");
  });
});
