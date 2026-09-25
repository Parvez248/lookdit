import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";

/**
 * Testimonials — independent social-proof records. May reference a portfolio
 * project, but survive its deletion (FK is nullable, ON DELETE SET NULL).
 * `status` is the single lifecycle source of truth (no approval/publish flags).
 */
export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    quote: text("quote").notNull(),
    authorName: text("author_name").notNull(),
    authorRole: text("author_role"),
    company: text("company"),
    // Object-storage key only — never binary data, never a signed/public URL.
    // The storage layer resolves display URLs later.
    avatarStorageKey: text("avatar_storage_key"),
    status: text("status").notNull().default("pending"),
    displayOrder: integer("display_order").notNull().default(1000),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Not auto-updated at the DB level; mutation code sets it (no trigger yet).
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Controlled lifecycle vocabulary (text + CHECK, not a pg enum).
    check(
      "testimonials_status_allowed",
      sql`${table.status} IN ('pending', 'approved', 'published', 'archived')`,
    ),
    // Non-blank quote / author (after trimming).
    check("testimonials_quote_not_blank", sql`length(btrim(${table.quote})) > 0`),
    check(
      "testimonials_author_name_not_blank",
      sql`length(btrim(${table.authorName})) > 0`,
    ),
    // Published rows must have a published_at; archived may keep historical time.
    check(
      "testimonials_published_requires_published_at",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
    // Serves: WHERE status = ? ORDER BY display_order ASC, created_at DESC
    index("testimonials_status_order_idx").on(
      table.status,
      table.displayOrder.asc(),
      table.createdAt.desc(),
    ),
    // Project-specific lookup; supports the nullable FK / ON DELETE SET NULL.
    index("testimonials_project_id_idx").on(table.projectId),
  ],
);
