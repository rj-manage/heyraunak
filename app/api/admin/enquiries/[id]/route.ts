// GET    /api/admin/enquiries/[id] - full enquiry detail (staff only)
// PATCH  /api/admin/enquiries/[id] - change status
// DELETE /api/admin/enquiries/[id] - permanently remove an enquiry (owner/admin)

import { vaultAdminUser } from "@/lib/rbac/guard";
import { json, sameOrigin } from "@/lib/vault/http";
import { deleteEnquiry, getEnquiryDetail, setEnquiryStatus } from "@/lib/enquiries/admin-service";
import { enquiryStatusSchema } from "@/lib/enquiries/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  try {
    const detail = await getEnquiryDetail(id);
    if (!detail) return json({ ok: false, message: "Not found." }, 404);
    return json({ ok: true, ...detail });
  } catch (err) {
    console.error("admin enquiries: detail failed -", (err as Error)?.message);
    return json({ ok: false, message: "Could not load this enquiry." }, 500);
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  if (!sameOrigin(request)) return json({ ok: false, message: "Forbidden." }, 403);

  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const parsed = enquiryStatusSchema.safeParse(body?.status);
  if (!parsed.success) return json({ ok: false, message: "Invalid status." }, 400);

  const { id } = await ctx.params;
  try {
    await setEnquiryStatus(id, parsed.data);
    return json({ ok: true, status: parsed.data });
  } catch (err) {
    console.error("admin enquiries: status failed -", (err as Error)?.message);
    return json({ ok: false, message: "Could not update the status." }, 500);
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, message: "Forbidden." }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;

  const allowed = guard.authed.roles.some((r) => r === "owner" || r === "admin");
  if (!allowed) return json({ ok: false, message: "Only an owner or admin can delete an enquiry." }, 403);

  const { id } = await ctx.params;
  try {
    await deleteEnquiry(id);
    return json({ ok: true });
  } catch (err) {
    console.error("admin enquiries: delete failed -", (err as Error)?.message);
    return json({ ok: false, message: "Could not delete the enquiry." }, 500);
  }
}
