import type { WorkStatus } from "../projects/status";

// What a client sees of a project's work status. Pure.

/**
 * Statuses shown in the portal. Cancelled projects stay internal: the client
 * was told elsewhere, and a dead project in their list helps no one.
 */
export const PORTAL_VISIBLE_STATUSES = ["active", "planned", "on_hold", "completed"] as const satisfies readonly WorkStatus[];

export type PortalWorkStatus = (typeof PORTAL_VISIBLE_STATUSES)[number];

/** Client-facing wording; "active" reads as staff jargon to a client. */
export const PORTAL_STATUS_LABELS: Record<PortalWorkStatus, string> = {
  active: "In progress",
  planned: "Planned",
  on_hold: "On hold",
  completed: "Completed",
};
