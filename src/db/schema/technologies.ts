import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Technologies — controlled vocabulary referenced by projects (real M:N).
 * Integer identity key keeps the join table narrow.
 */
export const technologies = pgTable(
  "technologies",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    slug: text("slug").notNull().unique("technologies_slug_unique"),
    name: text("name").notNull(),
    category: text("category").notNull(),
    iconKey: text("icon_key"),
    url: text("url"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(1000),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Not auto-updated at the DB level in this slice; mutation code sets it.
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "technologies_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
    check(
      "technologies_category_allowed",
      sql`${table.category} IN ('language', 'framework', 'runtime', 'database', 'infra', 'design-tool')`,
    ),
    index("technologies_active_order_idx").on(
      table.isActive,
      table.displayOrder,
    ),
  ],
);
