import { index, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

import { projects } from "./projects";
import { technologies } from "./technologies";

/**
 * Project ↔ Technology join (real M:N with referential integrity).
 * Composite PK (project_id, technology_id) — no surrogate id, no timestamps,
 * no metadata.
 */
export const projectTechnologies = pgTable(
  "project_technologies",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    technologyId: integer("technology_id")
      .notNull()
      .references(() => technologies.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({
      name: "project_technologies_pkey",
      columns: [table.projectId, table.technologyId],
    }),
    // Composite PK covers project → technologies; this index serves the
    // reverse leading-key access pattern technology → projects.
    index("project_technologies_technology_id_idx").on(table.technologyId),
  ],
);
