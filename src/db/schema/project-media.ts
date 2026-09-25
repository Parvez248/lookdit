import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";

/**
 * Project media — METADATA ONLY. Binary image/video content lives in object
 * storage; `storage_key` is the object-storage identifier/key (not a binary,
 * not a signed/public URL). Signed/public URLs are resolved by the storage
 * layer later.
 */
export const projectMedia = pgTable(
  "project_media",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    role: text("role").notNull(),
    storageKey: text("storage_key").notNull(),
    alt: text("alt"),
    width: integer("width"),
    height: integer("height"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
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
    // A project must not reference the same object-storage asset twice.
    unique("project_media_project_storage_unique").on(
      table.projectId,
      table.storageKey,
    ),
    // At most one canonical hero per project (there is no responsive-variant
    // dimension yet). Gallery/thumbnail/detail rows are unrestricted.
    uniqueIndex("project_media_one_hero_per_project_idx")
      .on(table.projectId)
      .where(sql`${table.role} = 'hero'`),
    check(
      "project_media_kind_allowed",
      sql`${table.kind} IN ('image', 'video')`,
    ),
    check(
      "project_media_role_allowed",
      sql`${table.role} IN ('hero', 'gallery', 'thumbnail', 'detail')`,
    ),
    // Dimensions/file size are optional, but must be positive when present.
    check(
      "project_media_width_positive",
      sql`${table.width} IS NULL OR ${table.width} > 0`,
    ),
    check(
      "project_media_height_positive",
      sql`${table.height} IS NULL OR ${table.height} > 0`,
    ),
    check(
      "project_media_file_size_positive",
      sql`${table.fileSize} IS NULL OR ${table.fileSize} > 0`,
    ),
    // Serves: WHERE project_id = ? ORDER BY display_order ASC
    index("project_media_project_order_idx").on(
      table.projectId,
      table.displayOrder,
    ),
  ],
);
