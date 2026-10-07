import { isUuid, parsePageParam } from "../uuid";

// Project vocabularies for the admin. Pure. Each list must match its CHECK on
// `projects` (`projects_work_status_allowed`, `projects_category_allowed`,
// `projects_status_allowed`).

/** Internal workflow. Admin only; never shown on the public site. */
export const WORK_STATUSES = ["planned", "active", "on_hold", "completed", "cancelled"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  planned: "Planned",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isWorkStatus(value: unknown): value is WorkStatus {
  return typeof value === "string" && (WORK_STATUSES as readonly string[]).includes(value);
}

export const PROJECT_CATEGORIES = ["web-app", "website", "product-design"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  "web-app": "Web app",
  website: "Website",
  "product-design": "Product design",
};

/** Public publishing state. Read only in the admin for now. */
export type PublicStatus = "draft" | "published" | "archived";

export const PUBLIC_STATUS_LABELS: Record<PublicStatus, string> = {
  draft: "Not published",
  published: "Published",
  archived: "Archived",
};

/** Project ids are UUIDs. */
export const isProjectId = isUuid;

export const PROJECTS_PAGE_SIZE = 25;

export function parseProjectListParams(params: Record<string, string | string[] | undefined>): {
  status: WorkStatus | null;
  page: number;
} {
  return { status: isWorkStatus(params.status) ? params.status : null, page: parsePageParam(params.page) };
}

export function projectListHref(status: WorkStatus | null, page = 1): string {
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/projects?${query}` : "/admin/projects";
}
