import { getAuthedUser } from "@/lib/rbac/server";
import { jsonError } from "@/lib/rbac/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proves the session + role read end to end. Returns only what the caller is
// allowed to know about themselves.
export async function GET(): Promise<Response> {
  if (!supabaseConfigured()) return jsonError(503, "not_configured");

  try {
    const authed = await getAuthedUser();
    if (!authed) return jsonError(401, "unauthenticated");

    return new Response(
      JSON.stringify({
        user: { id: authed.user.id, email: authed.user.email },
        roles: authed.roles
      }),
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("api/me failed:", (err as Error)?.message);
    return jsonError(500, "server_error");
  }
}
