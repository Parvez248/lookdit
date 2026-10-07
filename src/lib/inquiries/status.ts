import { isUuid, parsePageParam } from "../uuid";

// Inquiry statuses, in workflow order. Pure: shared by the admin pages, the
// status action and tests. Must match the `inquiries_status_allowed` CHECK.

export const INQUIRY_STATUSES = ["new", "reviewing", "replied", "closed", "spam"] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  replied: "Replied",
  closed: "Closed",
  spam: "Spam",
};

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && (INQUIRY_STATUSES as readonly string[]).includes(value);
}

/** Inquiry ids are UUIDs. */
export const isInquiryId = isUuid;

export const INQUIRIES_PAGE_SIZE = 20;

/**
 * Read `?status=` and `?page=` from the list URL. Anything unrecognised falls
 * back to all statuses and page 1, rather than erroring.
 */
export function parseInquiryListParams(params: Record<string, string | string[] | undefined>): {
  status: InquiryStatus | null;
  page: number;
} {
  const status = isInquiryStatus(params.status) ? params.status : null;
  return { status, page: parsePageParam(params.page) };
}

/** The list URL for a filter and page, omitting defaults so URLs stay short. */
export function inquiryListHref(status: InquiryStatus | null, page = 1): string {
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/inquiries?${query}` : "/admin/inquiries";
}
