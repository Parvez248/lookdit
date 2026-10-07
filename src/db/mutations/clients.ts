import "server-only";

import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { clients, inquiries } from "@/db/schema";
import type { ClientInput } from "@/lib/clients/validation";

// Admin client writes. Callers check the session and validate with
// parseClientForm first; columns are always listed explicitly.

export async function createClient(input: ClientInput): Promise<string> {
  const [row] = await getDb().insert(clients).values(input).returning({ id: clients.id });
  if (!row) throw new Error("Client insert returned no row.");
  return row.id;
}

/** Returns false when no client has this id. */
export async function updateClient(id: string, input: ClientInput): Promise<boolean> {
  const rows = await getDb()
    .update(clients)
    .set({ ...input, updatedAt: sql`now()` })
    .where(eq(clients.id, id))
    .returning({ id: clients.id });
  return rows.length > 0;
}

/**
 * "Make client": create a lead from an inquiry's name, email and company and
 * link the inquiry to it, in ONE statement so both happen or neither does.
 *
 * `FOR UPDATE` locks the inquiry row; a second, concurrent call waits, then
 * re-checks `client_id IS NULL` against the committed row and does nothing, so
 * double clicks can't create two clients. Returns the new client's id, or null
 * when the inquiry doesn't exist or is already linked.
 */
export async function createClientFromInquiry(inquiryId: string): Promise<string | null> {
  const result = await getDb().execute<{ client_id: string }>(sql`
    with source as (
      select ${inquiries.id} as id, ${inquiries.name} as name, ${inquiries.email} as email,
             ${inquiries.company} as company
      from ${inquiries}
      where ${inquiries.id} = ${inquiryId} and ${inquiries.clientId} is null
      for update
    ),
    created as (
      insert into ${clients} (${sql.identifier(clients.name.name)}, ${sql.identifier(clients.email.name)},
        ${sql.identifier(clients.company.name)}, ${sql.identifier(clients.status.name)})
      select name, email, company, 'lead' from source
      returning ${sql.identifier(clients.id.name)}
    )
    update ${inquiries}
    set ${sql.identifier(inquiries.clientId.name)} = (select id from created),
        ${sql.identifier(inquiries.updatedAt.name)} = now()
    where ${inquiries.id} = (select id from source)
    returning ${sql.identifier(inquiries.clientId.name)}
  `);
  return result.rows[0]?.client_id ?? null;
}
