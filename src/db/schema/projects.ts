import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Projects — queryable project metadata (PostgreSQL source of truth).
 * The long-form case-study narrative lives in MDX, resolved by `slug`.
 *
 * NOTE: `id` uses `uuidv7()`, a PostgreSQL 18 built-in. Verify the target
 * database is PostgreSQL 18 before applying any migration.
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    slug: text("slug").notNull().unique("projects_slug_unique"),
    title: text("title").notNull(),
    client: text("client"),
    category: text("category").notNull(),
    year: smallint("year").notNull(),
    summary: text("summary").notNull(),
    status: text("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(1000),
    liveUrl: text("live_url"),
    metrics: jsonb("metrics").$type<Array<{ label: string; value: string }>>(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Not auto-updated at the DB level in this slice; mutation code sets it.
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Canonical lowercase kebab-case slug.
    check(
      "projects_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
    // Controlled category vocabulary (text + CHECK, not a pg enum).
    check(
      "projects_category_allowed",
      sql`${table.category} IN ('web-app', 'website', 'product-design')`,
    ),
    // Controlled status vocabulary.
    check(
      "projects_status_allowed",
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
    check("projects_year_range", sql`${table.year} BETWEEN 2000 AND 2100`),
    // Published rows must have a published_at; draft/archived may keep history.
    check(
      "projects_published_requires_published_at",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
    // Serves: WHERE status = 'published'
    //         ORDER BY featured DESC, display_order ASC, year DESC
    index("projects_listing_idx").on(
      table.status,
      table.featured.desc(),
      table.displayOrder.asc(),
      table.year.desc(),
    ),
  ],
);
