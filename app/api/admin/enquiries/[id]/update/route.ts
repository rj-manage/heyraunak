// POST /api/admin/enquiries/[id]/update
//
// Sends the customer an update for the selected status: a transactional email
// (via the shared sender) and a prefilled WhatsApp deep link. There is no
// WhatsApp provider configured, so WhatsApp is returned as a wa.me link the
// admin opens with one tap.

import { vaultAdminUser } from "@/lib/rbac/guard";
import { json, sameOrigin } from "@/lib/vault/http";
import { getEnquiryUpdateTarget } from "@/lib/enquiries/admin-service";
import { enquiryStatusSchema } from "@/lib/enquiries/validation";
import { buildUpdateMessages } from "@/lib/enquiries/update-messages";
import { sendTransactional } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, message: "Forbidden." }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const parsed = enquiryStatusSchema.safeParse(body?.status);
  if (!parsed.success) return json({ ok: false, message: "Choose a status first." }, 400);

  const { id } = await ctx.params;

  let target;
  try {
    target = await getEnquiryUpdateTarget(id);
  } catch (err) {
    console.error("admin enquiries: update lookup failed -", (err as Error)?.message);
    return json({ ok: false, message: "Could not load this enquiry." }, 500);
  }
  if (!target) return json({ ok: false, message: "Enquiry not found." }, 404);

  const msg = buildUpdateMessages(parsed.data, {
    name: target.contact?.fullName || "",
    ref: target.enquiry_ref,
    service: target.service_name
  });

  // --- email ---
  const email = (target.contact?.email || "").trim();
  let emailResult: { sent: boolean; reason?: "no_email" | "not_configured" | "failed" } = {
    sent: false,
    reason: "no_email"
  };
  if (email) {
    try {
      const res = await sendTransactional({
        to: [email],
        subject: msg.subject,
        html: msg.emailHtml,
        text: msg.emailText
      });
      emailResult = res.ok ? { sent: true } : { sent: false, reason: res.status === 0 ? "not_configured" : "failed" };
    } catch (err) {
      console.error("admin enquiries: update email failed -", (err as Error)?.message);
      emailResult = { sent: false, reason: "failed" };
    }
  }

  // --- whatsapp (prefilled deep link; no provider configured) ---
  const digits = String(target.contact?.whatsapp || "").replace(/[^0-9]/g, "");
  const whatsappUrl =
    digits.length >= 7 ? "https://wa.me/" + digits + "?text=" + encodeURIComponent(msg.whatsapp) : null;

  return json({
    ok: true,
    status: parsed.data,
    label: msg.label,
    email: emailResult,
    whatsappUrl,
    whatsappText: msg.whatsapp
  });
}
