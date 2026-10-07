import "server-only";

import { asc, count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { clients, inquiries } from "@/db/schema";
import { CLIENTS_PAGE_SIZE, type ClientStatus } from "@/lib/clients/status";
import type { InquiryStatus } from "@/lib/inquiries/status";

// Admin reads of client data. Call only after requireUser().

export type ClientSummary = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  status: ClientStatus;
  updatedAt: Date;
};

export type ClientDetail = ClientSummary & {
  phone: string | null;
  website: string | null;
  notes: string | null;
  createdAt: Date;
};

/**
 * One page of clients in alphabetical order (case-insensitive, `id` breaks
 * ties), optionally filtered by status. The client list is small, so this
 * relies on a sort rather than an index until a real volume says otherwise.
 */
export async function listClients(status: ClientStatus | null, page: number): Promise<ClientSummary[]> {
  const rows = await getDb()
    .select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
      email: clients.email,
      status: clients.status,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .where(status ? eq(clients.status, status) : undefined)
    .orderBy(asc(sql`lower(${clients.name})`), asc(clients.id))
    .limit(CLIENTS_PAGE_SIZE)
    .offset((page - 1) * CLIENTS_PAGE_SIZE);
  // The CHECK constraint guarantees the status vocabulary.
  return rows as ClientSummary[];
}

export async function countClientsByStatus(): Promise<Record<ClientStatus, number>> {
  const rows = await getDb()
    .select({ status: clients.status, total: count() })
    .from(clients)
    .groupBy(clients.status);
  const counts: Record<ClientStatus, number> = { lead: 0, active: 0, past: 0 };
  for (const row of rows) counts[row.status as ClientStatus] = row.total;
  return counts;
}

export async function getClient(id: string): Promise<ClientDetail | null> {
  const [row] = await getDb()
    .select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
      email: clients.email,
      phone: clients.phone,
      website: clients.website,
      notes: clients.notes,
      status: clients.status,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  return (row as ClientDetail | undefined) ?? null;
}

/** The client's linked inquiries, newest first (`inquiries_client_id_created_at_idx`). */
export async function listClientInquiries(
  clientId: string,
): Promise<{ id: string; status: InquiryStatus; createdAt: Date; preview: string }[]> {
  const rows = await getDb()
    .select({
      id: inquiries.id,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      preview: sql<string>`left(${inquiries.message}, 140)`,
    })
    .from(inquiries)
    .where(eq(inquiries.clientId, clientId))
    .orderBy(desc(inquiries.createdAt), desc(inquiries.id))
    .limit(50);
  return rows as { id: string; status: InquiryStatus; createdAt: Date; preview: string }[];
}

/** Name of the client an inquiry is linked to, for the inquiry page. */
export async function getClientName(id: string): Promise<string | null> {
  const [row] = await getDb().select({ name: clients.name }).from(clients).where(eq(clients.id, id)).limit(1);
  return row?.name ?? null;
}
