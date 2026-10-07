import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Clients — the people and companies LOOKDIT works with (private, admin only).
 * Created by hand or from an inquiry ("Make client"); inquiries keep a nullable
 * link back. Not related to `projects.client`, which is public display text.
 */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    notes: text("notes"),
    status: text("status").notNull().default("lead"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Not auto-updated at the DB level; mutation code sets it (no trigger yet).
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Controlled status vocabulary (text + CHECK, not a pg enum), like inquiries.
    check("clients_status_allowed", sql`${table.status} IN ('lead', 'active', 'past')`),
    check("clients_name_not_blank", sql`length(btrim(${table.name})) > 0`),
    // Optional fields are NULL when empty, never "" (the app normalizes).
    check("clients_company_not_blank", sql`${table.company} IS NULL OR length(btrim(${table.company})) > 0`),
    check("clients_email_not_blank", sql`${table.email} IS NULL OR length(btrim(${table.email})) > 0`),
    check("clients_phone_not_blank", sql`${table.phone} IS NULL OR length(btrim(${table.phone})) > 0`),
    check("clients_website_not_blank", sql`${table.website} IS NULL OR length(btrim(${table.website})) > 0`),
    check("clients_notes_not_blank", sql`${table.notes} IS NULL OR length(btrim(${table.notes})) > 0`),
  ],
);
