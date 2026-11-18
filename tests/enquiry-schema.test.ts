import { describe, it, expect } from "vitest";
import {
  ALL_FORMS,
  CATEGORIES,
  COMMON_FIELDS,
  FORM_STEPS,
  fieldsForService,
  serviceNames
} from "@/lib/enquiries/schema";
import { buildAnswersSchema } from "@/lib/enquiries/validation";

const VALID_TYPES = new Set([
  "text",
  "textarea",
  "phone",
  "email",
  "url",
  "number",
  "select",
  "multi",
  "radio",
  "date",
  "budget",
  "slider",
  "file"
]);

const OPTION_TYPES = new Set(["select", "multi", "radio", "budget", "slider"]);

describe("enquiry schema", () => {
  it("defines exactly 65 services across the four categories", () => {
    expect(ALL_FORMS).toHaveLength(65);
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

  it("always has required Full Name, WhatsApp and Email, optional Company", () => {
    const byId = Object.fromEntries(COMMON_FIELDS.map((f) => [f.id, f]));
    expect(byId.full_name?.required).toBe(true);
    expect(byId.whatsapp?.required).toBe(true);
    expect(byId.email?.required).toBe(true);
    expect(byId.company?.required).toBeFalsy();
  });

  it("renders the estimated budget as a mandatory slider on every non-student service", () => {
    for (const form of ALL_FORMS) {
      const budget = form.fields.find((f) => f.id === "budget");
      if (form.category === "Student Projects") {
        expect(budget, form.service).toBeUndefined();
        continue;
      }
      expect(budget, form.service).toBeTruthy();
      expect(budget?.required, form.service).toBe(true);
      expect(budget?.type, form.service).toBe("slider");
      expect((budget?.options || []).length, form.service).toBeGreaterThan(1);
    }
  });

  it("student forms drop Company Name and budget and require the college name", () => {
    for (const form of ALL_FORMS) {
      if (form.category !== "Student Projects") continue;
      const fields = fieldsForService(form.service)!;
      const ids = fields.map((f) => f.id);
      expect(ids, form.service).not.toContain("company");
      expect(ids, form.service).not.toContain("budget");
      expect(fields.find((f) => f.id === "institution")?.required, form.service).toBe(true);
    }
  });

  it("expands allowOther select fields into a companion field", () => {
    const fields = fieldsForService("Business Website Development");
    expect(fields).toBeTruthy();
    expect(fields!.find((f) => f.id === "industry")?.allowOther).toBe(true);
    expect(fields!.some((f) => f.id === "industry_other")).toBe(true);
  });

  it("prepends the common fields to every service form", () => {
    const fields = fieldsForService("Search Engine Optimization (SEO)");
    expect(fields!.slice(0, 4).map((f) => f.id)).toEqual(["full_name", "whatsapp", "email", "company"]);
  });

  it("splits every service form into the three wizard steps", () => {
    expect(FORM_STEPS.map((s) => s.step)).toEqual([1, 2, 3]);
    for (const form of ALL_FORMS) {
      const fields = fieldsForService(form.service)!;
      const steps = Array.from(new Set(fields.map((f) => f.step))).sort();
      expect(steps, form.service).toEqual([1, 2, 3]);

      const stepOne = fields.filter((f) => f.step === 1).map((f) => f.id);
      const expectedStepOne =
        form.category === "Student Projects"
          ? ["full_name", "whatsapp", "email"]
          : ["full_name", "whatsapp", "email", "company"];
      expect(stepOne, form.service).toEqual(expectedStepOne);

      const budget = fields.find((f) => f.id === "budget");
      if (form.category === "Student Projects") expect(budget, form.service).toBeUndefined();
      else expect(budget?.step, form.service).toBe(3);
      expect(fields.some((f) => f.step === 2), form.service).toBe(true);
    }
  });
});

describe("answers validation", () => {
  const fields = fieldsForService("Landing Page Development")!;
  const schema = buildAnswersSchema(fields);

  it("requires name, whatsapp, email and budget", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(
      schema.safeParse({ full_name: "Ada", whatsapp: "+91 98765 43210", email: "ada@example.com" }).success
    ).toBe(false);
  });

  it("accepts a minimal valid submission", () => {
    const res = schema.safeParse({
      full_name: "Ada Lovelace",
      whatsapp: "+91 98765 43210",
      email: "ada@example.com",
      budget: "$500-$1,000"
    });
    expect(res.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const res = schema.safeParse({
      full_name: "Ada",
      whatsapp: "+91 98765 43210",
      email: "not-an-email",
      budget: "$500-$1,000"
    });
    expect(res.success).toBe(false);
  });

  it("rejects an invalid whatsapp number", () => {
    const res = schema.safeParse({ full_name: "Ada", whatsapp: "abc", email: "ada@example.com", budget: "$500-$1,000" });
    expect(res.success).toBe(false);
  });

  it("rejects an option that is not offered", () => {
    const res = schema.safeParse({
      full_name: "Ada",
      whatsapp: "+91 98765 43210",
      email: "ada@example.com",
      budget: "$500-$1,000",
      purpose: "Nonsense"
    });
    expect(res.success).toBe(false);
  });
});
