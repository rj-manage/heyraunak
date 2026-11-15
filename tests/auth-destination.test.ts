import { describe, expect, it } from "vitest";
import {
  NOT_YET_LIVE_ROUTES,
  STAFF_ROLES,
  defaultLandingFor,
  usableDestination
} from "@/lib/auth/destination";

describe("usableDestination", () => {
  it("accepts real in-app paths", () => {
    expect(usableDestination("/admin/project-vault")).toBe("/admin/project-vault");
    expect(usableDestination("/project-vault")).toBe("/project-vault");
    expect(usableDestination("/admin/project-vault/abc?tab=files")).toBe("/admin/project-vault/abc?tab=files");
  });

  it("rejects /portal, which is reserved but not live", () => {
    expect(NOT_YET_LIVE_ROUTES).toContain("/portal");
    expect(usableDestination("/portal")).toBeNull();
    expect(usableDestination("/portal?x=1")).toBeNull();
  });

  it("rejects external, protocol-relative and empty destinations", () => {
    expect(usableDestination("https://evil.example")).toBeNull();
    expect(usableDestination("//evil.example")).toBeNull();
    expect(usableDestination("admin")).toBeNull();
    expect(usableDestination("")).toBeNull();
    expect(usableDestination(null)).toBeNull();
    expect(usableDestination(undefined)).toBeNull();
  });
});

describe("defaultLandingFor", () => {
  it("sends staff to the admin console", () => {
    expect(STAFF_ROLES).toEqual(["owner", "admin", "project_manager"]);
    for (const role of STAFF_ROLES) expect(defaultLandingFor([role])).toBe("/admin/project-vault");
    expect(defaultLandingFor(["customer", "admin"])).toBe("/admin/project-vault");
  });

  it("sends customers, freelancers and unknown users to the public vault", () => {
    expect(defaultLandingFor(["customer"])).toBe("/project-vault");
    expect(defaultLandingFor(["freelancer"])).toBe("/project-vault");
    expect(defaultLandingFor(["finance"])).toBe("/project-vault");
    expect(defaultLandingFor([])).toBe("/project-vault");
  });

  it("never returns a route that does not exist", () => {
    for (const roles of [[], ["customer"], ["admin"], ["owner", "customer"]]) {
      expect(NOT_YET_LIVE_ROUTES).not.toContain(defaultLandingFor(roles));
    }
  });
});
