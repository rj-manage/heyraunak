import { describe, expect, it } from "vitest";
import {
  buildRow,
  clean,
  enquiryId,
  isValidEmail,
  round,
  safeCell,
  stamp,
  validate
} from "@/lib/enquiry/core";

const validBody = {
  category: "Web Design & Development",
  service: "E-commerce Website",
  service_id: "ecommerce",
  idempotency_key: "test-key-1",
  timeline: "Within 1 Month",
  budget_usd: 2500,
  advertising_spend_usd: null,
  platforms: ["Web Browser"],
  project_details: { "Store / Brand Name": "Acme", "Store features": ["Payments", "Inventory sync"] },
  contact: {
    "Full Name": "Ada Lovelace",
    "Email Address": "ada@example.com",
    "Phone / WhatsApp Number": "+91 90000 00000",
    Country: "India",
    "Additional Message": "Hello"
  }
};

describe("clean", () => {
  it("strips control characters, collapses whitespace and trims", () => {
    expect(clean("  a\u0007  b\n c  ", 100)).toBe("a b c");
  });
  it("caps length", () => {
    expect(clean("abcdef", 3)).toBe("abc");
  });
  it("handles null/undefined", () => {
    expect(clean(null, 10)).toBe("");
    expect(clean(undefined, 10)).toBe("");
  });
});

describe("safeCell (formula-injection guard)", () => {
  it("prefixes dangerous leading characters", () => {
    expect(safeCell("=1+1")).toBe("'=1+1");
    expect(safeCell("+A1")).toBe("'+A1");
    expect(safeCell("-A1")).toBe("'-A1");
    expect(safeCell("@x")).toBe("'@x");
  });
  it("leaves numbers and safe text untouched", () => {
    expect(safeCell(42)).toBe(42);
    expect(safeCell("Rock & Roll")).toBe("Rock & Roll");
  });
});

describe("round", () => {
  it("clamps to the allowed money range", () => {
    expect(round(5, 10, 100000)).toBeNull();
    expect(round(200000, 10, 100000)).toBeNull();
    expect(round(2500.4, 10, 100000)).toBe(2500);
  });
  it("returns null for empty/non-numeric", () => {
    expect(round("", 10, 100000)).toBeNull();
    expect(round("abc", 10, 100000)).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("accepts and rejects", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("nope")).toBe(false);
  });
});

describe("enquiryId", () => {
  it("matches the Apps Script id pattern and is stable per key+day", () => {
    const at = new Date("2026-11-12T10:00:00Z");
    const id = enquiryId("abc", at);
    expect(id).toMatch(/^RJ-\d{8}-[0-9A-Z]{8}$/);
    expect(id).toBe(enquiryId("abc", at));
    expect(id).not.toBe(enquiryId("other", at));
  });
});

describe("stamp", () => {
  it("is a UTC timestamp string", () => {
    expect(stamp(new Date("2026-11-12T09:08:07Z"))).toBe("2026-11-12 09:08:07 UTC");
  });
});

describe("validate", () => {
  it("accepts a complete enquiry", () => {
    const { data, errors } = validate(validBody);
    expect(errors).toEqual({});
    expect(data.category).toBe("Web Design & Development");
    expect(data.fullName).toBe("Ada Lovelace");
    expect(data.budget).toBe(2500);
    expect(data.platforms).toEqual(["Web Browser"]);
    expect(data.details["Store / Brand Name"]).toBe("Acme");
    // arrays are flattened for storage
    expect(data.details["Store features"]).toBe("Payments, Inventory sync");
  });

  it("reports missing required fields", () => {
    const { errors } = validate({ ...validBody, contact: {} });
    expect(errors.full_name).toBe("required");
    expect(errors.email).toBe("invalid");
    expect(errors.phone).toBe("required");
    expect(errors.country).toBe("required");
  });

  it("requires a timeline", () => {
    const { errors } = validate({ ...validBody, timeline: "" });
    expect(errors.timeline).toBe("required");
  });

  it("caps the number of project detail keys", () => {
    const details: Record<string, string> = {};
    for (let i = 0; i < 60; i++) details["k" + i] = "v";
    const { data } = validate({ ...validBody, project_details: details });
    expect(Object.keys(data.details).length).toBe(40);
  });
});

describe("buildRow", () => {
  it("produces exactly the 16-column sheet row", () => {
    const { data } = validate(validBody);
    const row = buildRow(data, "RJ-20261112-ABCDEF12", "2026-11-12 09:08:07 UTC");
    expect(row.length).toBe(16);
    expect(row[0]).toBe("RJ-20261112-ABCDEF12");
    expect(row[6]).toBe("Web Design & Development");
    expect(row[7]).toBe("E-commerce Website");
    expect(row[10]).toBe(2500);
    expect(row[14]).toBe("New");
  });
});
