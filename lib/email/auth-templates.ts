// ============================================================
// RJ Studio - sign-in email (email OTP)
// ------------------------------------------------------------
// Sent by our own transactional sender so it shares the verified
// heyraunak.site domain (SPF/DKIM) instead of Supabase's default mailer.
// ============================================================

export interface AuthEmail {
  subject: string;
  html: string;
  text: string;
}

const CANVAS = "#e3e9f0";
const INK = "#2a3444";
const MUTED = "#5b6675";
const MINT = "#156a47";

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c];
  });
}

export function signInEmail(input: { code: string; minutes: number }): AuthEmail {
  const code = esc(input.code);
  const minutes = input.minutes;

  return {
    subject: "Your RJ Studio sign-in code",
    html:
      `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:${CANVAS};padding:24px">` +
      `<div style="max-width:560px;margin:0 auto;background:${CANVAS};border-radius:16px;padding:28px">` +
      `<p style="margin:0 0 6px;color:${MINT};font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>` +
      `<h1 style="margin:0 0 16px;color:${INK};font-size:22px">Your sign-in code</h1>` +
      `<p style="margin:0 0 12px;color:${INK};font-size:14px;line-height:1.6">Use the code below to sign in to the RJ Studio admin console. It expires in ${minutes} minutes.</p>` +
      `<p style="margin:18px 0;padding:16px;border-radius:14px;background:${CANVAS};box-shadow:inset 3px 3px 6px #c3cdda, inset -3px -3px 6px #f7fafe;` +
      `color:${INK};font-size:24px;font-weight:700;letter-spacing:.12em;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace">${code}</p>` +
      `<p style="margin:0 0 12px;color:${INK};font-size:14px;line-height:1.6">Enter it on the sign-in page to continue.</p>` +
      `<p style="margin:20px 0 0;color:${MUTED};font-size:13px">If you did not request this, you can safely ignore this email — no one can sign in without the code.</p>` +
      `<p style="margin:16px 0 0;padding-top:14px;border-top:1px solid rgba(60,80,110,.14);color:${MUTED};font-size:12px;line-height:1.6">RJ Studio · Bengaluru, India<br />This is a transactional message about your account.</p>` +
      `</div></div>`,
    text:
      "RJ Studio - sign-in code\n\n" +
      `Your sign-in code is: ${input.code}\n` +
      `It expires in ${minutes} minutes.\n\n` +
      "Enter it on the sign-in page to continue.\n\n" +
      "If you did not request this, you can ignore this email."
  };
}
