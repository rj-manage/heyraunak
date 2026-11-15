// GET /api/admin/enquiries - list service enquiries (staff only).

import { vaultAdminUser } from "@/lib/rbac/guard";
import { json } from "@/lib/vault/http";
import { listEnquiries } from "@/lib/enquiries/admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const guard = await vaultAdminUser();
  if (!guard.ok) return guard.response;

  try {
    const data = await listEnquiries();
    return json({ ok: true, ...data });
  } catch (err) {
    console.error("admin enquiries: list failed -", (err as Error)?.message);
    return json({ ok: false, message: "Could not load enquiries." }, 500);
  }
}
