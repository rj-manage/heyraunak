"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const configured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type State = { tone: "idle" | "ok" | "error"; message: string };

export default function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<State>({ tone: "idle", message: "" });

  function redirectUrl() {
    const params = new URLSearchParams({ next });
    return `${window.location.origin}/auth/callback?${params.toString()}`;
  }

  async function oauth(provider: "google" | "github") {
    setBusy(true);
    setState({ tone: "idle", message: "" });
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl() }
    });
    if (error) {
      setBusy(false);
      setState({ tone: "error", message: error.message });
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setState({ tone: "idle", message: "" });
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl() }
    });
    setBusy(false);
    if (error) {
      setState({ tone: "error", message: error.message });
      return;
    }
    setSent(true);
    setState({ tone: "ok", message: "Check your inbox - we sent you a sign-in link and code." });
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setState({ tone: "idle", message: "" });
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      setBusy(false);
      setState({ tone: "error", message: error.message });
      return;
    }
    window.location.assign(next || "/portal");
  }

  if (!configured) {
    return (
      <p className="auth-note" data-tone="error">
        Authentication is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign-in.
      </p>
    );
  }

  return (
    <>
      <div className="auth-actions">
        <button className="soft-btn" type="button" disabled={busy} onClick={() => oauth("google")}>
          Continue with Google
        </button>
        <button className="soft-btn ghost" type="button" disabled={busy} onClick={() => oauth("github")}>
          Continue with GitHub
        </button>
      </div>

      <div className="auth-divider">or</div>

      <form onSubmit={sent ? verifyCode : sendLink} noValidate>
        <div className="f-field">
          <label htmlFor="email">Email Address</label>
          <input
            className="f-input"
            id="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        {sent && (
          <div className="f-field">
            <label htmlFor="code">Sign-in code</label>
            <input
              className="f-input"
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
            />
          </div>
        )}

        <button className="soft-btn" type="submit" disabled={busy || !email}>
          {busy ? "Working…" : sent ? "Verify code" : "Email me a sign-in link"}
        </button>
      </form>

      {(state.message || state.tone !== "idle") && (
        <p className="auth-note" data-tone={state.tone} role="status" aria-live="polite">
          {state.message}
        </p>
      )}
    </>
  );
}
