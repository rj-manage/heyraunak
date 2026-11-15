import { describe, it, expect } from "vitest";
import {
  ALL_FORMS,
  CATEGORIES,
  COMMON_FIELDS,
  fieldsForService,
  serviceNames
} from "@/lib/enquiries/schema";
import { buildAnswersSchema } from "@/lib/enquiries/validation";

const VALID_TYPES = new Set([
  "text",
  "textarea",
  "phone",
  "url",
  "number",
  "select",
  "multi",
  "radio",
  "date",
  "budget",
  "file"
]);

const OPTION_TYPES = new Set(["select", "multi", "radio", "budget"]);

describe("enquiry schema", () => {
  it("defines exactly 60 services across the three categories", () => {
    expect(ALL_FORMS).toHaveLength(60);
    const cats = Array.from(new Set(ALL_FORMS.map((f) => f.category))).sort();
    expect(cats).toEqual([...CATEGORIES].sort());
  });

  it("has unique service names", () => {
    const names = serviceNames();
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every service several of its own fields (not a generic form)", () => {
    for (const form of ALL_FORMS) {
      expect(form.fields.length, form.service).toBeGreaterThanOrEqual(5);
    }
  });

  it("only uses known field types, unique ids and options where required", () => {
    for (const form of ALL_FORMS) {
      const seen = new Set<string>();
      for (const field of form.fields) {
        expect(VALID_TYPES.has(field.type), `${form.service}:${field.id}=${field.type}`).toBe(true);
        expect(field.label.length, `${form.service}:${field.id}`).toBeGreaterThan(0);
        expect(seen.has(field.id), `duplicate id ${form.service}:${field.id}`).toBe(false);
        seen.add(field.id);
        if (OPTION_TYPES.has(field.type)) {
          expect((field.options || []).length, `${form.service}:${field.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("always has required Full Name and WhatsApp, optional Company", () => {
    const byId = Object.fromEntries(COMMON_FIELDS.map((f) => [f.id, f]));
    expect(byId.full_name?.required).toBe(true);
    expect(byId.whatsapp?.required).toBe(true);
    expect(byId.company?.required).toBeFalsy();
  });

  it("expands allowOther select fields into a companion field", () => {
    const fields = fieldsForService("Business Website Development");
    expect(fields).toBeTruthy();
    expect(fields!.find((f) => f.id === "industry")?.allowOther).toBe(true);
    expect(fields!.some((f) => f.id === "industry_other")).toBe(true);
  });

  it("prepends the common fields to every service form", () => {
    const fields = fieldsForService("Search Engine Optimization (SEO)");
    expect(fields!.slice(0, 3).map((f) => f.id)).toEqual(["full_name", "whatsapp", "company"]);
  });
});

describe("answers validation", () => {
  const fields = fieldsForService("Landing Page Development")!;
  const schema = buildAnswersSchema(fields);

  it("requires name and whatsapp", () => {
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("accepts a minimal valid submission", () => {
    const res = schema.safeParse({ full_name: "Ada Lovelace", whatsapp: "+91 98765 43210" });
    expect(res.success).toBe(true);
  });

  it("rejects an invalid whatsapp number", () => {
    const res = schema.safeParse({ full_name: "Ada", whatsapp: "abc" });
    expect(res.success).toBe(false);
  });

  it("rejects an option that is not offered", () => {
    const res = schema.safeParse({
      full_name: "Ada",
      whatsapp: "+91 98765 43210",
      purpose: "Nonsense"
    });
    expect(res.success).toBe(false);
  });
});
