import { json, sameOrigin } from "@/lib/vault/http";
import { vaultAdminUser } from "@/lib/rbac/guard";
import { createHandoverSchema, fieldErrors } from "@/lib/vault/validation";
import { createHandover, listHandovers } from "@/lib/vault/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;
  try {
    return json({ ok: true, ...(await listHandovers()) });
  } catch {
    return json({ ok: false, message: "Could not load handovers." }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const parsed = createHandoverSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, fields: fieldErrors(parsed.error) }, 400);

  try {
    const created = await createHandover(
      {
        clientName: parsed.data.clientName,
        clientEmail: parsed.data.clientEmail,
        projectName: parsed.data.projectName,
        projectReference: parsed.data.projectReference ?? null,
        serviceCategory: parsed.data.serviceCategory ?? null,
        description: parsed.data.description ?? null,
        handoverMessage: parsed.data.handoverMessage ?? null,
        deliveryDate: parsed.data.deliveryDate ?? null,
        expiresAt: parsed.data.expiresAt ?? null,
        status: parsed.data.status
      },
      guard.authed.user.id
    );
    return json({ ok: true, id: created.id, accessCode: created.accessCode }, 201);
  } catch {
    return json({ ok: false, message: "Could not create the handover." }, 500);
  }
}
