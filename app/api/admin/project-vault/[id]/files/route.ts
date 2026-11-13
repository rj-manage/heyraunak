import { json, sameOrigin } from "@/lib/vault/http";
import { vaultAdminUser } from "@/lib/rbac/guard";
import { addFile, getHandoverDetail } from "@/lib/vault/admin-service";
import { MAX_FILE_BYTES } from "@/lib/vault/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  const detail = await getHandoverDetail(id);
  if (!detail) return json({ ok: false, message: "Not found." }, 404);
  return json({ ok: true, files: detail.files });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, message: "Expected a file upload." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return json({ ok: false, message: "No file provided." }, 400);
  if (file.size > MAX_FILE_BYTES) return json({ ok: false, message: "That file is too large." }, 413);

  try {
    const created = await addFile(id, file);
    return json({ ok: true, id: created.id }, 201);
  } catch (err) {
    const message = (err as Error)?.message || "";
    if (message === "file_extension") {
      return json({ ok: false, message: "That file type is not allowed." }, 415);
    }
    if (message === "file_size") return json({ ok: false, message: "That file is too large." }, 413);
    return json({ ok: false, message: "Could not upload the file." }, 500);
  }
}
