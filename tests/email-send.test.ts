import { describe, it, expect, vi, afterEach } from "vitest";
import { sendTransactional } from "@/lib/email/send";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function stubEnv() {
  vi.stubEnv("EMAIL_PROVIDER_API_KEY", "test-key");
  vi.stubEnv("EMAIL_SENDER_ADDRESS", "enquiries@heyraunak.site");
  vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "admin@example.com");
}

describe("sendTransactional", () => {
  it("adds a display name, a default reply-to and a well-formed HTML document", async () => {
    stubEnv();
    let sent: Record<string, unknown> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent = JSON.parse(String(init.body));
        return { ok: true, status: 200 } as Response;
      })
    );

    const res = await sendTransactional({ to: ["a@b.com"], subject: "Hi", html: "<p>hey</p>", text: "hey" });

    expect(res).toEqual({ ok: true, status: 200 });
    expect(sent.from).toBe("RJ Studio <enquiries@heyraunak.site>");
    // defaults to the sending domain, not the free-mail admin address
    expect(sent.reply_to).toBe("enquiries@heyraunak.site");
    expect(String(sent.html)).toContain("<!DOCTYPE html>");
    expect(String(sent.html)).toContain("<p>hey</p>");
  });

  it("honours EMAIL_REPLY_TO when set", async () => {
    stubEnv();
    vi.stubEnv("EMAIL_REPLY_TO", "support@heyraunak.site");
    let sent: Record<string, unknown> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent = JSON.parse(String(init.body));
        return { ok: true, status: 200 } as Response;
      })
    );

    await sendTransactional({ to: ["a@b.com"], subject: "Hi", html: "<p>x</p>", text: "x" });
    expect(sent.reply_to).toBe("support@heyraunak.site");
  });

  it("keeps an explicit reply-to and does not double-wrap a full document", async () => {
    stubEnv();
    let sent: Record<string, unknown> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent = JSON.parse(String(init.body));
        return { ok: true, status: 200 } as Response;
      })
    );

    await sendTransactional({
      to: ["a@b.com"],
      subject: "Hi",
      html: "<!DOCTYPE html><html><body>x</body></html>",
      text: "x",
      replyTo: "reply@rj.example"
    });

    expect(sent.reply_to).toBe("reply@rj.example");
    expect(String(sent.html).match(/<!DOCTYPE html>/gi)?.length).toBe(1);
  });

  it("returns a not-configured result without a key", async () => {
    vi.stubEnv("EMAIL_PROVIDER_API_KEY", "");
    vi.stubEnv("EMAIL_SENDER_ADDRESS", "");
    const res = await sendTransactional({ to: ["a@b.com"], subject: "s", html: "<p>x</p>", text: "x" });
    expect(res.ok).toBe(false);
  });
});
