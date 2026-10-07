import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { projectMilestones, projectTasks } from "@/db/schema";
import type { TaskStatus } from "@/lib/workspace/status";
import type { MilestoneInput, NewTaskInput, TaskInput } from "@/lib/workspace/validation";

// Admin milestone and task writes. Callers check the session and validate
// first. Every update and delete matches on project id AND row id, so a row can
// only be changed through its own project's URL. Booleans report "row found".

export async function createMilestone(projectId: string, input: MilestoneInput): Promise<void> {
  await getDb().insert(projectMilestones).values({ projectId, ...input });
}

export async function updateMilestone(projectId: string, id: string, input: MilestoneInput): Promise<boolean> {
  const rows = await getDb()
    .update(projectMilestones)
    .set({ ...input, updatedAt: sql`now()` })
    .where(and(eq(projectMilestones.projectId, projectId), eq(projectMilestones.id, id)))
    .returning({ id: projectMilestones.id });
  return rows.length > 0;
}

/** Mark done (keeps the first completion time if already done) or reopen. */
export async function setMilestoneCompleted(projectId: string, id: string, completed: boolean): Promise<boolean> {
  const rows = await getDb()
    .update(projectMilestones)
    .set({
      completedAt: completed ? sql`coalesce(${projectMilestones.completedAt}, now())` : null,
      updatedAt: sql`now()`,
    })
    .where(and(eq(projectMilestones.projectId, projectId), eq(projectMilestones.id, id)))
    .returning({ id: projectMilestones.id });
  return rows.length > 0;
}

/** Its tasks stay on the project without a milestone (FK `ON DELETE SET NULL (milestone_id)`). */
export async function deleteMilestone(projectId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(projectMilestones)
    .where(and(eq(projectMilestones.projectId, projectId), eq(projectMilestones.id, id)))
    .returning({ id: projectMilestones.id });
  return rows.length > 0;
}

/** A milestone from another project fails the composite FK (SQLSTATE 23503). */
export async function createTask(projectId: string, input: NewTaskInput): Promise<void> {
  await getDb().insert(projectTasks).values({ projectId, ...input });
}

export async function updateTask(projectId: string, id: string, input: TaskInput): Promise<boolean> {
  const rows = await getDb()
    .update(projectTasks)
    .set({ ...input, updatedAt: sql`now()` })
    .where(and(eq(projectTasks.projectId, projectId), eq(projectTasks.id, id)))
    .returning({ id: projectTasks.id });
  return rows.length > 0;
}

export async function setTaskStatus(projectId: string, id: string, status: TaskStatus): Promise<boolean> {
  const rows = await getDb()
    .update(projectTasks)
    .set({ status, updatedAt: sql`now()` })
    .where(and(eq(projectTasks.projectId, projectId), eq(projectTasks.id, id)))
    .returning({ id: projectTasks.id });
  return rows.length > 0;
}

export async function deleteTask(projectId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(projectTasks)
    .where(and(eq(projectTasks.projectId, projectId), eq(projectTasks.id, id)))
    .returning({ id: projectTasks.id });
  return rows.length > 0;
}
