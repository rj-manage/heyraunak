// RJ Studio branded transactional emails for Project Vault.
// Same visual language as the existing enquiry emails. Never include file links,
// never include access codes except in the explicit code-instructions email.

export interface VaultEmail {
  subject: string;
  html: string;
  text: string;
}

const CANVAS = "#e3e9f0";
const INK = "#2a3444";
const MUTED = "#5b6675";
const MINT = "#156a47";

function shell(heading: string, bodyHtml: string, footerNote?: string): string {
  return (
    `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:${CANVAS};padding:24px">` +
    `<div style="max-width:560px;margin:0 auto;background:${CANVAS};border-radius:16px;padding:28px">` +
    `<p style="margin:0 0 6px;color:${MINT};font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>` +
    `<h1 style="margin:0 0 16px;color:${INK};font-size:22px">${heading}</h1>` +
    bodyHtml +
    (footerNote
      ? `<p style="margin:22px 0 0;color:${MUTED};font-size:13px;line-height:1.6">${footerNote}</p>`
      : "") +
    `<p style="margin:20px 0 0;color:${MUTED};font-size:13px">Regards,<br />RJ Studio</p>` +
    `</div></div>`
  );
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;color:${INK};font-size:14px;line-height:1.6">${text}</p>`;
}

function codeBlock(value: string): string {
  return (
    `<p style="margin:18px 0;padding:16px;border-radius:14px;background:${CANVAS};box-shadow:inset 3px 3px 6px #c3cdda, inset -3px -3px 6px #f7fafe;` +
    `color:${INK};font-size:24px;font-weight:700;letter-spacing:.12em;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace">${value}</p>`
  );
}

function esc(value: string): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c];
  });
}

/** 1. Email verification OTP. Contains no project or file information. */
export function otpEmail(input: { otp: string; minutes: number }): VaultEmail {
  return {
    subject: "Your RJ Studio Project Vault verification code",
    html: shell(
      "Verify your email",
      p("Use the code below to open your Project Vault. It expires in " + input.minutes + " minutes.") +
        codeBlock(input.otp) +
        p("If you did not request this, you can ignore this email - no one can open your project without this code."),
      "For your security, never share this code with anyone."
    ),
    text:
      "RJ Studio - Project Vault\n\n" +
      "Your verification code is: " + input.otp + "\n" +
      "It expires in " + input.minutes + " minutes.\n\n" +
      "If you did not request this, ignore this email."
  };
}

/** 2. Access code instructions (sent by an administrator, deliberately). */
export function accessCodeEmail(input: {
  clientName: string;
  projectName: string;
  projectReference?: string | null;
  accessCode: string;
}): VaultEmail {
  const ref = input.projectReference ? " (" + esc(input.projectReference) + ")" : "";
  return {
    subject: "Your Project Vault access code - " + input.projectName,
    html: shell(
      "Your project is ready",
      p("Hello " + esc(input.clientName) + ",") +
        p("Your completed work for <b>" + esc(input.projectName) + "</b>" + ref + " is ready to download from the RJ Studio Project Vault.") +
        codeBlock(input.accessCode) +
        p("Open the Project Vault and enter this code. We will then send a one-time code to this email address to confirm it is you."),
      "Keep this code private - it is the first of two security steps."
    ),
    text:
      "RJ Studio - Project Vault\n\n" +
      "Project: " + input.projectName + ref + "\n" +
      "Access code: " + input.accessCode + "\n\n" +
      "Open the Project Vault and enter this code; we will then email you a one-time verification code."
  };
}

/** 3. Handover ready notification. */
export function handoverReadyEmail(input: { clientName: string; projectName: string }): VaultEmail {
  return {
    subject: "Your project is ready - " + input.projectName,
    html: shell(
      "Ready for handover",
      p("Hello " + esc(input.clientName) + ",") +
        p("<b>" + esc(input.projectName) + "</b> has been prepared for handover. Your access code and instructions have been sent separately."),
      "If you have not received your access code, reply to this email and we will help."
    ),
    text:
      "RJ Studio\n\n" +
      "Project: " + input.projectName + " is ready for handover.\n" +
      "Your access code has been sent separately."
  };
}

/** 4. Access revoked. */
export function accessRevokedEmail(input: { clientName: string; projectName: string }): VaultEmail {
  return {
    subject: "Project Vault access updated - " + input.projectName,
    html: shell(
      "Access has been updated",
      p("Hello " + esc(input.clientName) + ",") +
        p("Access to the Project Vault for <b>" + esc(input.projectName) + "</b> has been revoked and any open session closed."),
      "If this was not expected, reply to this email and we will restore access."
    ),
    text:
      "RJ Studio\n\n" +
      "Access to " + input.projectName + " has been revoked.\n" +
      "If this was not expected, reply to this email."
  };
}

/** 5. Expiry reminder. */
export function expiryReminderEmail(input: {
  clientName: string;
  projectName: string;
  expiresOn: string;
}): VaultEmail {
  return {
    subject: "Your Project Vault access expires soon - " + input.projectName,
    html: shell(
      "Access expires soon",
      p("Hello " + esc(input.clientName) + ",") +
        p("Access to the Project Vault for <b>" + esc(input.projectName) + "</b> expires on <b>" + esc(input.expiresOn) + "</b>.") +
        p("Please download and store anything you need before then."),
      "We can extend access on request."
    ),
    text:
      "RJ Studio\n\n" +
      "Access to " + input.projectName + " expires on " + input.expiresOn + ".\n" +
      "Please download anything you need before then."
  };
}

/** 6. Updated deliverables. */
export function updatedDeliverablesEmail(input: { clientName: string; projectName: string }): VaultEmail {
  return {
    subject: "New files added - " + input.projectName,
    html: shell(
      "New files are available",
      p("Hello " + esc(input.clientName) + ",") +
        p("We have added new deliverables to the Project Vault for <b>" + esc(input.projectName) + "</b>.") +
        p("Open the vault to see them."),
      "Your existing access code still works."
    ),
    text:
      "RJ Studio\n\n" +
      "New files have been added to " + input.projectName + " in the Project Vault.\n" +
      "Your existing access code still works."
  };
}
