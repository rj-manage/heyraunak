import "server-only";
import { redirect } from "next/navigation";
import { AuthError, getAuthedUser, jsonError, requireRole, type AuthedUser } from "./server";
import { canManageVault, VAULT_ADMIN_ROLES } from "./roles";

const ADMIN_PATH = "/admin/project-vault";

/** Server-component guard. Redirects instead of throwing. */
export async function requireVaultAdminPage(): Promise<AuthedUser> {
  const authed = await getAuthedUser();
  if (!authed) redirect(`/sign-in?next=${encodeURIComponent(ADMIN_PATH)}`);
  if (!canManageVault(authed.roles)) redirect("/");
  return authed;
}

export type VaultAdminGuard =
  | { ok: true; authed: AuthedUser }
  | { ok: false; response: Response };

/** Route-handler guard: either the acting admin, or a 401/403 Response. */
export async function vaultAdminUser(): Promise<VaultAdminGuard> {
  try {
    const authed = await requireRole(...VAULT_ADMIN_ROLES);
    return { ok: true, authed };
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return { ok: false, response: jsonError(status, status === 401 ? "unauthenticated" : "forbidden") };
  }
}

export async function guardVaultAdmin(): Promise<Response | null> {
  const guard = await vaultAdminUser();
  return guard.ok ? null : guard.response;
}
