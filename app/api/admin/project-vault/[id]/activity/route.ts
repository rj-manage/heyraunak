import { json } from "@/lib/vault/http";
import { vaultAdminUser } from "@/lib/rbac/guard";
import { listActivity } from "@/lib/vault/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  try {
    return json({ ok: true, events: await listActivity(id) });
  } catch {
    return json({ ok: false, message: "Could not load activity." }, 500);
  }
}
