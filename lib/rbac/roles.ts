// Role definitions and pure authorisation helpers.
// No imports on purpose - safe to unit test and to use on either side of the
// network boundary. Never trust a role supplied by the browser.

export const ROLES = [
  "owner",
  "admin",
  "project_manager",
  "finance",
  "freelancer",
  "customer"
] as const;

export type Role = (typeof ROLES)[number];

/** Roles that may see RJ Studio operational data (not freelancers/customers). */
export const STAFF_ROLES: readonly Role[] = ["owner", "admin", "project_manager", "finance"];

/** Roles allowed to see every customer's records. */
export const CUSTOMER_VIEWER_ROLES: readonly Role[] = STAFF_ROLES;

/** Roles that may operate the Project Vault admin area. */
export const VAULT_ADMIN_ROLES: readonly Role[] = ["owner", "admin", "project_manager"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function hasRole(roles: readonly Role[], ...allowed: Role[]): boolean {
  return roles.some((r) => allowed.includes(r));
}

export function isStaff(roles: readonly Role[]): boolean {
  return hasRole(roles, ...STAFF_ROLES);
}

/** Owner/admin only - managing the platform itself. */
export function isAdmin(roles: readonly Role[]): boolean {
  return hasRole(roles, "owner", "admin");
}

/** Staff (except freelancer/customer) may read any customer's records. */
export function canViewAnyCustomer(roles: readonly Role[]): boolean {
  return hasRole(roles, ...CUSTOMER_VIEWER_ROLES);
}

/** A customer may only ever touch their own rows. */
export function canViewCustomer(roles: readonly Role[], ownUserId: string, targetUserId: string): boolean {
  if (canViewAnyCustomer(roles)) return true;
  return ownUserId === targetUserId;
}

/** Only staff may issue or revise proposals. */
export function canManageProposals(roles: readonly Role[]): boolean {
  return isStaff(roles);
}

/** Only owner/admin/project_manager may operate Project Vault admin. */
export function canManageVault(roles: readonly Role[]): boolean {
  return hasRole(roles, ...VAULT_ADMIN_ROLES);
}

/** Only owner/admin/finance may touch money. */
export function canManagePayments(roles: readonly Role[]): boolean {
  return hasRole(roles, "owner", "admin", "finance");
}

export function parseRoles(values: readonly unknown[]): Role[] {
  return values.filter(isRole);
}
