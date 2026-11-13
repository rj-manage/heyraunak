import { json, sameOrigin } from "@/lib/vault/http";
import { vaultAdminUser } from "@/lib/rbac/guard";
import { handoverStatusSchema } from "@/lib/vault/validation";
import { setHandoverStatus } from "@/lib/vault/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Revoking or expiring also revokes every live client session.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
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

  const parsed = handoverStatusSchema.safeParse((body as { status?: unknown })?.status);
  if (!parsed.success) return json({ ok: false, message: "Invalid status." }, 400);

  try {
    await setHandoverStatus(id, parsed.data);
    return json({ ok: true, status: parsed.data });
  } catch {
    return json({ ok: false, message: "Could not update the status." }, 500);
  }
}
