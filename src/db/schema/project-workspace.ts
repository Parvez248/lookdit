import { sql } from "drizzle-orm";
import { check, date, foreignKey, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { projects } from "./projects";

/**
 * Project workspace (admin only): milestones group a project's work into phases;
 * tasks are the actions under a project, optionally inside a milestone. Both are
 * deleted with their project. The public site never reads these tables.
 */
export const projectMilestones = pgTable(
  "project_milestones",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueOn: date("due_on", { mode: "string" }),
    // Done when set. One timestamp instead of a status column.
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("project_milestones_title_not_blank", sql`length(btrim(${table.title})) > 0`),
    // Target of the tasks' composite FK (a task's milestone must be in the same
    // project). Leading project_id also serves "milestones for this project".
    unique("project_milestones_project_id_id_unique").on(table.projectId, table.id),
  ],
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    milestoneId: uuid("milestone_id"),
    title: text("title").notNull(),
    status: text("status").notNull().default("todo"),
    dueOn: date("due_on", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("project_tasks_status_allowed", sql`${table.status} IN ('todo', 'doing', 'done')`),
    check("project_tasks_title_not_blank", sql`length(btrim(${table.title})) > 0`),
    // Same-project milestone only. The migration adds ON DELETE SET NULL
    // (milestone_id) by hand: deleting a milestone keeps its tasks, unscheduled.
    foreignKey({
      name: "project_tasks_milestone_fk",
      columns: [table.projectId, table.milestoneId],
      foreignColumns: [projectMilestones.projectId, projectMilestones.id],
    }),
    // Serves: a project's tasks (the workspace) and the composite FK.
    index("project_tasks_project_id_milestone_id_idx").on(table.projectId, table.milestoneId),
  ],
);
