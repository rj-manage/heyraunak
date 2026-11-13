import { json, sameOrigin } from "@/lib/vault/http";
import { vaultAdminUser } from "@/lib/rbac/guard";
import { fieldErrors, updateHandoverSchema } from "@/lib/vault/validation";
import { getHandoverDetail, updateHandover } from "@/lib/vault/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  try {
    const detail = await getHandoverDetail(id);
    if (!detail) return json({ ok: false, message: "Not found." }, 404);
    return json({ ok: true, ...detail });
  } catch {
    return json({ ok: false, message: "Could not load the handover." }, 500);
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const parsed = updateHandoverSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, fields: fieldErrors(parsed.error) }, 400);

  try {
    await updateHandover(id, parsed.data);
    return json({ ok: true });
  } catch {
    return json({ ok: false, message: "Could not update the handover." }, 500);
  }
}
