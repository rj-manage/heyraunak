import { json, sameOrigin } from "@/lib/vault/http";
import { vaultAdminUser } from "@/lib/rbac/guard";
import { regenerateAccessCode } from "@/lib/vault/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the new code exactly once; only its hash is stored.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  try {
    const code = await regenerateAccessCode(id);
    return json({ ok: true, accessCode: code });
  } catch {
    return json({ ok: false, message: "Could not regenerate the access code." }, 500);
  }
}
