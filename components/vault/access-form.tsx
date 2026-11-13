"use client";

import { useEffect, useState } from "react";

type Step = "code" | "otp";

interface ApiResult {
  ok?: boolean;
  message?: string;
  issueToken?: string;
  maskedEmail?: string;
  expiresInMinutes?: number;
  retryAfter?: number;
}

export default function AccessForm() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");
  const [issueToken, setIssueToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function post(url: string, body: unknown): Promise<ApiResult> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = (await res.json().catch(() => ({}))) as ApiResult;

    if (res.status === 429) {
      const wait = data.retryAfter ?? 60;
      setCooldown(Math.max(1, wait));
    }
    return data;
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setTone("idle");
    setMessage("");

    try {
      const data = await post("/api/project-vault/verify-code", { code });
      if (data.ok) {
        setIssueToken(data.issueToken ?? "");
        setMaskedEmail(data.maskedEmail ?? "");
        setStep("otp");
        setTone("ok");
        setMessage("We sent a verification code to " + (data.maskedEmail ?? "your email") + ".");
        setCooldown(60);
      } else {
        setTone("error");
        setMessage(data.message || "We couldn't verify that code. Please check it and try again.");
      }
    } catch {
      setTone("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length !== 6 || busy) return;
    setBusy(true);
    setTone("idle");
    setMessage("");

    try {
      const data = await post("/api/project-vault/verify-otp", { issueToken, otp });
      if (data.ok) {
        window.location.assign("/project-vault/delivery");
        return;
      }
      setTone("error");
      setMessage(data.message || "That code is not valid. Please check it and try again.");
    } catch {
      setTone("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await post("/api/project-vault/send-otp", { issueToken });
      if (data.ok) {
        setIssueToken(data.issueToken ?? issueToken);
        setTone("ok");
        setMessage("A new code is on its way.");
        setOtp("");
        setCooldown(60);
      } else {
        setTone("error");
        setMessage(data.message || "We couldn't resend the code just yet.");
      }
    } catch {
      setTone("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vault-card">
      <ol className="vault-steps" aria-label="Progress">
        <li className={step === "code" ? "on" : "done"}>
          <i>01</i>
          <span>Access code</span>
        </li>
        <li className={step === "otp" ? "on" : ""}>
          <i>02</i>
          <span>Email verification</span>
        </li>
      </ol>

      {step === "code" ? (
        <>
          <h2>Enter your access code</h2>
          <p>Your code begins with RJ and was sent to your registered email address.</p>
          <form onSubmit={submitCode} noValidate>
            <div className="f-field">
              <label htmlFor="vault-code">Project Access Code</label>
              <input
                className="f-input"
                id="vault-code"
                name="code"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="RJ-XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="vault-actions">
              <button className="soft-btn" type="submit" disabled={busy || !code.trim()}>
                {busy ? "Checking…" : "Continue"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2>Check your email</h2>
          <p>
            Enter the 6-digit code we sent to <b>{maskedEmail || "your registered email"}</b>. It expires in{" "}
            10 minutes.
          </p>
          <form onSubmit={submitOtp} noValidate>
            <div className="f-field">
              <label htmlFor="vault-otp">Verification code</label>
              <input
                className="f-input"
                id="vault-otp"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={busy}
              />
            </div>
            <div className="vault-actions">
              <button className="soft-btn" type="submit" disabled={busy || otp.length !== 6}>
                {busy ? "Verifying…" : "Open my project"}
              </button>
              <button
                className="soft-btn ghost"
                type="button"
                onClick={resend}
                disabled={busy || cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
          <p className="vault-note">
            <button
              type="button"
              className="soft-btn ghost sm"
              onClick={() => {
                setStep("code");
                setOtp("");
                setMessage("");
                setTone("idle");
              }}
            >
              Use a different access code
            </button>
          </p>
        </>
      )}

      {message ? (
        <p className="vault-note" data-tone={tone} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="vault-help">
        Lost your access code?{" "}
        <a href="mailto:theprofessionalrj@gmail.com?subject=Project%20Vault%20access%20code">Email RJ Studio</a>{" "}
        or <a href="/contact/">contact us</a> from your registered address.
      </div>
    </div>
  );
}
