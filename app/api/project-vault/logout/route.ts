import { fail, json, sameOrigin } from "@/lib/vault/http";
import { clearSessionCookie, readSessionCookie } from "@/lib/vault/cookies";
import { revokeSession } from "@/lib/vault/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return fail(403);

  const token = await readSessionCookie();
  if (token) await revokeSession(token);
  await clearSessionCookie();

  return json({ ok: true });
}
