// ============================================================
// RJ Studio - enquiry email templates (admin notification)
// ============================================================

export interface EnquiryEmailData {
  ref: string;
  category: string;
  service: string;
  contact: { fullName: string; whatsapp: string; company: string };
  details: { label: string; value: unknown }[];
  submittedAt: string;
}

function esc(s: unknown): string {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c];
  });
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  return String(value == null ? "" : value);
}

export function enquiryAdminSubject(d: EnquiryEmailData): string {
  return `New service enquiry · ${d.service} · ${d.ref}`;
}

export function enquiryAdminText(d: EnquiryEmailData): string {
  const lines = [
    "New service enquiry - RJ Studio",
    "",
    `Reference: ${d.ref}`,
    `Category:  ${d.category}`,
    `Service:   ${d.service}`,
    `Submitted: ${d.submittedAt}`,
    "",
    "- Contact -",
    `Name:     ${d.contact.fullName || "-"}`,
    `WhatsApp: ${d.contact.whatsapp || "-"}`,
    `Company:  ${d.contact.company || "-"}`,
    "",
    "- Requirements -"
  ];
  if (d.details.length) {
    for (const item of d.details) lines.push(`${item.label}: ${formatValue(item.value)}`);
  } else {
    lines.push("(none provided)");
  }
  return lines.join("\n");
}

export function enquiryAdminHtml(d: EnquiryEmailData): string {
  const rows = (d.details.length ? d.details : [{ label: "(none provided)", value: "" }])
    .map(
      (item) =>
        `<tr><td style="padding:6px 12px;color:#5b6675;vertical-align:top">${esc(item.label)}</td>` +
        `<td style="padding:6px 12px;color:#2a3444">${esc(formatValue(item.value))}</td></tr>`
    )
    .join("");

  return (
    '<div style="max-width:640px;margin:0 auto;background:#e3e9f0;border-radius:16px;padding:28px;font-family:Inter,Arial,sans-serif">' +
    '<p style="margin:0 0 6px;color:#156a47;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>' +
    '<h1 style="margin:0 0 4px;color:#2a3444;font-size:22px">New service enquiry</h1>' +
    `<p style="margin:0 0 20px;color:#5b6675;font-size:13px">${esc(d.ref)} · ${esc(d.service)}</p>` +
    '<table style="width:100%;border-collapse:collapse;background:#f7fafe;border-radius:12px;overflow:hidden">' +
    '<tr><td style="padding:6px 12px;color:#5b6675">Name</td><td style="padding:6px 12px;color:#2a3444">' +
    esc(d.contact.fullName || "-") +
    "</td></tr>" +
    '<tr><td style="padding:6px 12px;color:#5b6675">WhatsApp</td><td style="padding:6px 12px;color:#2a3444">' +
    esc(d.contact.whatsapp || "-") +
    "</td></tr>" +
    '<tr><td style="padding:6px 12px;color:#5b6675">Company</td><td style="padding:6px 12px;color:#2a3444">' +
    esc(d.contact.company || "-") +
    "</td></tr>" +
    "</table>" +
    '<h2 style="margin:22px 0 8px;color:#2a3444;font-size:15px">Requirements</h2>' +
    '<table style="width:100%;border-collapse:collapse">' +
    rows +
    "</table>" +
    '<p style="margin:22px 0 0;color:#5b6675;font-size:12px">View this enquiry in the admin: /admin/enquiries</p>' +
    "</div>"
  );
}
