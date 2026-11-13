export const HANDOVER_STATUSES = [
  "draft",
  "preparing",
  "ready",
  "accessed",
  "completed",
  "expired",
  "revoked"
] as const;

export type HandoverStatus = (typeof HANDOVER_STATUSES)[number];

export const FILE_CATEGORIES = ["main", "documentation", "assets", "additional"] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  main: "Main Project Files",
  documentation: "Documentation",
  assets: "Project Assets",
  additional: "Additional Deliverables"
};

export interface HandoverLifecycle {
  status: HandoverStatus;
  expires_at: string | Date | null;
}

/** `expired` is derived from expires_at, so a stale row cannot stay accessible. */
export function effectiveStatus(handover: HandoverLifecycle, now: Date = new Date()): HandoverStatus {
  if (handover.status === "revoked") return "revoked";
  if (handover.status === "expired") return "expired";
  if (handover.expires_at) {
    const expiry = handover.expires_at instanceof Date ? handover.expires_at : new Date(handover.expires_at);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() <= now.getTime()) return "expired";
  }
  return handover.status;
}

/** Only a live, released handover may be opened by a client. */
export function isClientAccessible(handover: HandoverLifecycle, now: Date = new Date()): boolean {
  const status = effectiveStatus(handover, now);
  return status === "ready" || status === "accessed" || status === "completed";
}

export const HANDOVER_STATUS_LABELS: Record<HandoverStatus, string> = {
  draft: "Draft",
  preparing: "Preparing",
  ready: "Ready for Handover",
  accessed: "Accessed",
  completed: "Completed",
  expired: "Expired",
  revoked: "Revoked"
};
