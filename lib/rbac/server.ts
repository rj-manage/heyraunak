import "server-only";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { hasRole, parseRoles, type Role } from "./roles";

export interface AuthedUser {
  user: User;
  roles: Role[];
}

/** Current user + roles, or null when not signed in. */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (error) throw new Error("failed to load roles: " + error.message);

  return { user, roles: parseRoles((data ?? []).map((r: { role: unknown }) => r.role)) };
}

/** Requires any signed-in user. */
export async function requireUser(): Promise<AuthedUser> {
  const authed = await getAuthedUser();
  if (!authed) throw new AuthError(401, "unauthenticated");
  return authed;
}

/** Requires one of the given roles. Server-side, never client-supplied. */
export async function requireRole(...allowed: Role[]): Promise<AuthedUser> {
  const authed = await requireUser();
  if (!hasRole(authed.roles, ...allowed)) throw new AuthError(403, "forbidden");
  return authed;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonError(status: number, error: string, message?: string): Response {
  return new Response(JSON.stringify(message ? { error, message } : { error }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
