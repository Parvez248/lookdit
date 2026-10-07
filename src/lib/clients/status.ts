import { isUuid, parsePageParam } from "../uuid";

// Client statuses. Pure. Must match the `clients_status_allowed` CHECK.

export const CLIENT_STATUSES = ["lead", "active", "past"] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  lead: "Lead",
  active: "Active",
  past: "Past",
};

export function isClientStatus(value: unknown): value is ClientStatus {
  return typeof value === "string" && (CLIENT_STATUSES as readonly string[]).includes(value);
}

/** Client ids are UUIDs. */
export const isClientId = isUuid;

export const CLIENTS_PAGE_SIZE = 25;

export function parseClientListParams(params: Record<string, string | string[] | undefined>): {
  status: ClientStatus | null;
  page: number;
} {
  return { status: isClientStatus(params.status) ? params.status : null, page: parsePageParam(params.page) };
}

export function clientListHref(status: ClientStatus | null, page = 1): string {
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/clients?${query}` : "/admin/clients";
}
