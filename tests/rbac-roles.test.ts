import { describe, expect, it } from "vitest";
import {
  ROLES,
  canManagePayments,
  canManageProposals,
  canViewAnyCustomer,
  canViewCustomer,
  hasRole,
  isAdmin,
  isRole,
  isStaff,
  parseRoles,
  type Role
} from "@/lib/rbac/roles";

describe("role set", () => {
  it("is exactly the six agreed roles", () => {
    expect([...ROLES]).toEqual(["owner", "admin", "project_manager", "finance", "freelancer", "customer"]);
  });
  it("isRole narrows unknown input", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("superuser")).toBe(false);
    expect(isRole(42)).toBe(false);
  });
});

describe("hasRole / isStaff / isAdmin", () => {
  it("matches any of the allowed roles", () => {
    expect(hasRole(["finance"], "owner", "finance")).toBe(true);
    expect(hasRole(["customer"], "owner", "finance")).toBe(false);
  });
  it("treats staff roles as staff, and freelancer/customer as not", () => {
    expect(isStaff(["owner"])).toBe(true);
    expect(isStaff(["project_manager"])).toBe(true);
    expect(isStaff(["freelancer"])).toBe(false);
    expect(isStaff(["customer"])).toBe(false);
  });
  it("reserves admin for owner/admin", () => {
    expect(isAdmin(["owner"])).toBe(true);
    expect(isAdmin(["admin"])).toBe(true);
    expect(isAdmin(["finance"])).toBe(false);
  });
});

describe("customer record access", () => {
  it("lets a customer see only their own record", () => {
    const roles: Role[] = ["customer"];
    expect(canViewCustomer(roles, "u1", "u1")).toBe(true);
    expect(canViewCustomer(roles, "u1", "u2")).toBe(false);
  });
  it("lets staff see any customer", () => {
    expect(canViewAnyCustomer(["project_manager"])).toBe(true);
    expect(canViewCustomer(["finance"], "staff", "someone-else")).toBe(true);
  });
  it("does not let a freelancer or customer see other customers", () => {
    expect(canViewAnyCustomer(["freelancer"])).toBe(false);
    expect(canViewCustomer(["freelancer"], "f1", "c1")).toBe(false);
  });
});

describe("capability gates", () => {
  it("only staff manage proposals", () => {
    expect(canManageProposals(["project_manager"])).toBe(true);
    expect(canManageProposals(["freelancer"])).toBe(false);
  });
  it("only owner/admin/finance manage money", () => {
    expect(canManagePayments(["finance"])).toBe(true);
    expect(canManagePayments(["admin"])).toBe(true);
    expect(canManagePayments(["project_manager"])).toBe(false);
  });
});

describe("parseRoles", () => {
  it("keeps valid roles, drops unknown values", () => {
    expect(parseRoles(["admin", "hacker", "customer", null])).toEqual(["admin", "customer"]);
  });
});
