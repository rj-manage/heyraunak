import { json, sameOrigin } from "@/lib/vault/http";
import { vaultAdminUser } from "@/lib/rbac/guard";
import { fieldErrors, fileMetadataSchema } from "@/lib/vault/validation";
import { deleteFile, updateFile } from "@/lib/vault/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; fileId: string }> }
): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id, fileId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const parsed = fileMetadataSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, fields: fieldErrors(parsed.error) }, 400);

  try {
    await updateFile(id, fileId, parsed.data);
    return json({ ok: true });
  } catch {
    return json({ ok: false, message: "Could not update the file." }, 500);
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string; fileId: string }> }
): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id, fileId } = await ctx.params;

  try {
    await deleteFile(id, fileId);
    return json({ ok: true });
  } catch (err) {
    if ((err as Error)?.message === "not_found") return json({ ok: false, message: "Not found." }, 404);
    return json({ ok: false, message: "Could not remove the file." }, 500);
  }
}
