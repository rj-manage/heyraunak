// ============================================================
// RJ Studio - enquiry validation
// ------------------------------------------------------------
// The answers schema is built dynamically from the service field
// config, so the server validates against the very same schema the
// browser rendered.
// ============================================================

import { z } from "zod";
import { MAX_TEXT, MAX_SHORT } from "./core";
import type { EnquiryField } from "./schema";

const PHONE_RE = /^\+?[0-9][0-9 ()-]{6,19}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const enquiryStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "more_info_required",
  "qualified",
  "not_qualified",
  "proposal_preparation",
  "proposal_sent",
  "closed",
  "cancelled"
]);

export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>;

export const enquiryPayloadSchema = z.object({
  service: z.string().trim().min(1).max(120),
  idempotency_key: z.string().trim().min(8).max(80),
  started_at: z.coerce.number().int().nonnegative().optional(),
  hp: z.string().max(200).optional().default(""),
  answers: z.record(z.string(), z.unknown()).default({})
});

export type EnquiryPayload = z.infer<typeof enquiryPayloadSchema>;

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

function fieldSchema(f: EnquiryField): z.ZodTypeAny {
  const req = !!f.required;
  const text = req
    ? z.string().trim().min(1, "This field is required.").max(MAX_TEXT)
    : z.string().trim().max(MAX_TEXT).optional();

  switch (f.type) {
    case "multi": {
      const arr = z.array(z.string().trim().max(MAX_SHORT)).max(60);
      return req ? arr.min(1, "Please select at least one.") : arr.optional().default([]);
    }
    case "number": {
      const num = z.coerce
        .number()
        .min(f.min ?? 0, "Enter a valid number.")
        .max(f.max ?? 1_000_000_000, "That number is too large.");
      return req ? num : z.preprocess(emptyToUndefined, num.optional());
    }
    case "date": {
      const d = z.string().trim().regex(DATE_RE, "Enter a valid date.");
      return req ? d : z.preprocess(emptyToUndefined, d.optional());
    }
    case "url": {
      const u = z.string().trim().regex(URL_RE, "Enter a valid URL (starting with http).");
      return req ? u : z.preprocess(emptyToUndefined, u.optional());
    }
    case "phone": {
      const p = z
        .string()
        .trim()
        .min(1, "This field is required.")
        .max(MAX_TEXT)
        .refine((v) => PHONE_RE.test(v), "Enter a valid phone number with country code.");
      return req ? p : p.optional();
    }
    case "email": {
      const e = z
        .string()
        .trim()
        .min(1, "This field is required.")
        .max(MAX_TEXT)
        .refine((v) => EMAIL_RE.test(v), "Enter a valid email address.");
      return req ? e : e.optional();
    }
    case "select":
    case "radio":
    case "budget":
    case "slider": {
      const options = f.options ?? [];
      if (options.length) {
        const allowed = f.allowOther ? [...options, "Other"] : options;
        const one = z
          .string()
          .trim()
          .refine((v) => allowed.includes(v), "Choose one of the options.");
        return req ? one : z.preprocess(emptyToUndefined, one.optional());
      }
      return req ? text : z.string().trim().max(MAX_TEXT).optional();
    }
    case "file":
      return z.unknown().optional();
    default:
      return text;
  }
}

/** Builds a Zod object validating an answers map against a field list. */
export function buildAnswersSchema(fields: EnquiryField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) shape[f.id] = fieldSchema(f);
  return z.object(shape);
}

/** Flat field-id -> first error message, for the API response. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
