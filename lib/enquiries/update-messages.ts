// ============================================================
// RJ Studio - customer enquiry update messages
// ------------------------------------------------------------
// One customer-facing message per enquiry status, used by the admin
// "Send Update" action for both the email and the WhatsApp text.
// ============================================================

import type { EnquiryStatus } from "./validation";

export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  draft: "Draft",
  submitted: "New",
  under_review: "Under review",
  more_info_required: "More info needed",
  qualified: "Qualified",
  not_qualified: "Not qualified",
  proposal_preparation: "Preparing proposal",
  proposal_sent: "Proposal sent",
  closed: "Closed",
  cancelled: "Cancelled"
};

/** The one sentence that changes with the status (complete, no trailing period). */
const STATUS_LINE: Record<EnquiryStatus, string> = {
  draft: "We are preparing your enquiry",
  submitted: "We have received your enquiry and will review it shortly",
  under_review: "Your enquiry is now under review by our team",
  more_info_required:
    "We need a little more information to move your enquiry forward - please reply with the details you can share",
  qualified: "Good news - your enquiry has been qualified and we will be in touch about the next steps",
  not_qualified: "After reviewing your enquiry, we are unable to take it forward at this time",
  proposal_preparation: "We are preparing a proposal for your enquiry",
  proposal_sent: "We have sent you a proposal - please review it and let us know if you have any questions",
  closed: "Your enquiry has been closed - thank you for reaching out",
  cancelled: "Your enquiry has been cancelled"
};

export interface UpdateContext {
  name: string;
  ref: string;
  service: string;
}

export interface UpdateMessages {
  status: EnquiryStatus;
  label: string;
  line: string;
  subject: string;
  emailText: string;
  emailHtml: string;
  whatsapp: string;
}

function esc(s: unknown): string {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c];
  });
}

export function buildUpdateMessages(status: EnquiryStatus, ctx: UpdateContext): UpdateMessages {
  const label = STATUS_LABEL[status];
  const line = STATUS_LINE[status];
  const name = (ctx.name || "").trim();
  const hi = name ? `Hi ${name},` : "Hello,";

  const subject = `Update on your enquiry · ${label} · ${ctx.ref}`;

  const emailText = [
    hi,
    "",
    `${line}.`,
    "",
    `Reference: ${ctx.ref}`,
    `Service:   ${ctx.service}`,
    `Status:    ${label}`,
    "",
    "If you have any questions, just reply to this email.",
    "",
    "- RJ Studio"
  ].join("\n");

  const emailHtml =
    '<div style="max-width:640px;margin:0 auto;background:#e3e9f0;border-radius:16px;padding:28px;font-family:Inter,Arial,sans-serif">' +
    '<p style="margin:0 0 6px;color:#156a47;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>' +
    '<h1 style="margin:0 0 4px;color:#2a3444;font-size:22px">Update on your enquiry</h1>' +
    `<p style="margin:0 0 20px;color:#5b6675;font-size:13px">${esc(ctx.ref)} · ${esc(ctx.service)}</p>` +
    `<p style="margin:0 0 14px;color:#2a3444;font-size:15px">${esc(hi)}</p>` +
    `<p style="margin:0 0 18px;color:#2a3444;font-size:15px">${esc(line)}.</p>` +
    '<table style="width:100%;border-collapse:collapse;background:#f7fafe;border-radius:12px;overflow:hidden">' +
    '<tr><td style="padding:6px 12px;color:#5b6675">Reference</td><td style="padding:6px 12px;color:#2a3444">' +
    esc(ctx.ref) +
    "</td></tr>" +
    '<tr><td style="padding:6px 12px;color:#5b6675">Service</td><td style="padding:6px 12px;color:#2a3444">' +
    esc(ctx.service) +
    "</td></tr>" +
    '<tr><td style="padding:6px 12px;color:#5b6675">Status</td><td style="padding:6px 12px;color:#2a3444">' +
    esc(label) +
    "</td></tr>" +
    "</table>" +
    '<p style="margin:20px 0 0;color:#5b6675;font-size:13px">If you have any questions, just reply to this email.</p>' +
    "</div>";

  const whatsapp = [
    hi,
    "",
    `${line}.`,
    "",
    `Ref: ${ctx.ref} · ${ctx.service}`,
    "- RJ Studio"
  ].join("\n");

  return { status, label, line, subject, emailText, emailHtml, whatsapp };
}
