import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["owner", "admin", "project_manager"];

// OAuth / email-link callback.
//
// Destination resolution: explicit `next` query, then the short-lived `rj_next`
// cookie set before sign-in, then a role-based default (staff -> admin console,
// everyone else -> portal). Every failure path becomes an explicit sign-in
// redirect with a reason code, never a dead end.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const nextParam = url.searchParams.get("next");
  const cookieNext = readCookie(request, "rj_next");
  // Only honour destinations that actually exist in this phase. "/portal" is
  // reserved for the customer portal and would 404 today.
  const usable = (v: string | null): v is string => !!v && v.startsWith("/") && v !== "/portal";
  const explicit = [nextParam, cookieNext].find(usable);

  if (!code) return finish(url, "/sign-in?error=missing_code");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) return finish(url, "/sign-in?error=exchange");
    if (explicit) return finish(url, explicit);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const list = (roles ?? []).map((r: { role: string }) => r.role);
      if (list.some((role) => STAFF_ROLES.includes(role))) {
        return finish(url, "/admin/project-vault");
      }
    }

    // Everyone else lands on the public Project Vault (portal is not live yet).
    return finish(url, "/project-vault");
  } catch {
    return finish(url, "/sign-in?error=exchange");
  }
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  const hit = raw
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  if (!hit) return null;
  const value = hit.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function finish(origin: URL, path: string): NextResponse {
  const res = NextResponse.redirect(new URL(path, origin.origin));
  res.cookies.set("rj_next", "", { path: "/", maxAge: 0 });
  return res;
}
