// Post-authentication destination rules, shared by the OAuth callback and the
// email-OTP flow. Kept pure so they can be unit tested — the "/portal" bug that
// caused a 404 after sign-in twice is guarded here.

/** Roles that may enter the admin console. */
export const STAFF_ROLES = ["owner", "admin", "project_manager"] as const;

/**
 * Routes that are reserved but not live yet. Redirecting to one of these is what
 * produced the custom 404 page after sign-in, so they are filtered out.
 */
export const NOT_YET_LIVE_ROUTES = ["/portal"] as const;

/** Returns the destination only if it is a safe, existing in-app path. */
export function usableDestination(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null; // no external or protocol-relative redirects
  if (value.startsWith("//")) return null;
  const path = value.split("?")[0];
  if ((NOT_YET_LIVE_ROUTES as readonly string[]).includes(path)) return null;
  return value;
}

/** Default landing page for a signed-in user, based on their roles. */
export function defaultLandingFor(roles: readonly string[]): string {
  return roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r))
    ? "/admin/project-vault"
    : "/project-vault";
}
