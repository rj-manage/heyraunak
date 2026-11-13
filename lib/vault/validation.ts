import { z } from "zod";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const codeField = z.string().trim().min(1).max(64);
const issueTokenField = z.string().trim().min(20).max(200);
const shortText = z.string().trim().max(300);
const longText = z.string().trim().max(4000);

// ---------- public (client) ----------
export const verifyCodeSchema = z.object({ code: codeField });
export const sendOtpSchema = z.object({ issueToken: issueTokenField });
export const verifyOtpSchema = z.object({
  issueToken: issueTokenField,
  otp: z.string().trim().regex(/^[0-9]{6}$/, "invalid_otp")
});

// ---------- admin ----------
export const handoverStatusSchema = z.enum([
  "draft",
  "preparing",
  "ready",
  "accessed",
  "completed",
  "expired",
  "revoked"
]);

export const fileCategorySchema = z.enum(["main", "documentation", "assets", "additional"]);

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date");

export const createHandoverSchema = z.object({
  projectId: z.string().trim().regex(UUID_RE, "invalid_uuid").nullish(),
  customerId: z.string().trim().regex(UUID_RE, "invalid_uuid").nullish(),
  clientName: z.string().trim().min(1).max(200),
  clientEmail: z.string().trim().regex(EMAIL_RE, "invalid_email").max(200),
  projectName: z.string().trim().min(1).max(200),
  projectReference: shortText.nullish(),
  serviceCategory: shortText.nullish(),
  description: longText.nullish(),
  handoverMessage: longText.nullish(),
  deliveryDate: isoDate.nullish(),
  expiresAt: isoDate.nullish(),
  status: handoverStatusSchema.default("draft"),
  generateCode: z.boolean().default(true)
});

export const updateHandoverSchema = z.object({
  clientName: z.string().trim().min(1).max(200).optional(),
  clientEmail: z.string().trim().regex(EMAIL_RE, "invalid_email").max(200).optional(),
  projectName: z.string().trim().min(1).max(200).optional(),
  projectReference: shortText.nullish(),
  serviceCategory: shortText.nullish(),
  description: longText.nullish(),
  handoverMessage: longText.nullish(),
  deliveryDate: isoDate.nullish(),
  expiresAt: isoDate.nullish(),
  status: handoverStatusSchema.optional()
});

export const fileMetadataSchema = z.object({
  displayName: z.string().trim().max(200).nullish(),
  description: z.string().trim().max(1000).nullish(),
  category: fileCategorySchema.optional(),
  isVisible: z.boolean().optional(),
  isDownloadable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional()
});

export type CreateHandoverInput = z.infer<typeof createHandoverSchema>;
export type UpdateHandoverInput = z.infer<typeof updateHandoverSchema>;
export type FileMetadataInput = z.infer<typeof fileMetadataSchema>;

/** Turns a Zod error into a flat field map for the API response. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
