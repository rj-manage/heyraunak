"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Signs out via Supabase Auth, clears the session cookies, then hard-replaces
// the history entry so Back cannot restore an authenticated admin view.
export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    if (!window.confirm("Are you sure you want to log out?")) return;

    setBusy(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        setBusy(false);
        return;
      }
      window.location.replace("/sign-in?loggedOut=1");
    } catch {
      setError("Could not sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button className="soft-btn ghost sm" type="button" onClick={onClick} disabled={busy}>
        {busy ? "Signing out…" : "Log out"}
      </button>
      {error ? (
        <p className="vault-note" data-tone="error" role="alert" style={{ marginTop: 8 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
