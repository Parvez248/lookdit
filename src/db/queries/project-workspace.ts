import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { projectMilestones, projectTasks } from "@/db/schema";
import type { TaskStatus } from "@/lib/workspace/status";

// Reads of a project's milestones and tasks. Call only after requireUser() (admin),
// or through getPortalProjectView() in ./portal, which checks ownership first.

export type MilestoneRow = {
  id: string;
  title: string;
  dueOn: string | null;
  completedAt: Date | null;
};

export type TaskRow = {
  id: string;
  milestoneId: string | null;
  title: string;
  status: TaskStatus;
  dueOn: string | null;
};

export type Workspace = { milestones: MilestoneRow[]; tasks: TaskRow[] };

/**
 * Everything the project page shows, in two indexed queries. Milestones: by due
 * date (undated last), then added order. Tasks: unfinished first, then by due
 * date, then added order; the page groups them by milestone.
 */
export async function getWorkspace(projectId: string): Promise<Workspace> {
  const db = getDb();
  const [milestones, tasks] = await Promise.all([
    db
      .select({
        id: projectMilestones.id,
        title: projectMilestones.title,
        dueOn: projectMilestones.dueOn,
        completedAt: projectMilestones.completedAt,
      })
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(sql`${projectMilestones.dueOn} asc nulls last`, asc(projectMilestones.createdAt), asc(projectMilestones.id)),
    db
      .select({
        id: projectTasks.id,
        milestoneId: projectTasks.milestoneId,
        title: projectTasks.title,
        status: projectTasks.status,
        dueOn: projectTasks.dueOn,
      })
      .from(projectTasks)
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(
        sql`(${projectTasks.status} = 'done') asc`,
        sql`${projectTasks.dueOn} asc nulls last`,
        asc(projectTasks.createdAt),
        asc(projectTasks.id),
      ),
  ]);
  // The CHECK constraint guarantees the status vocabulary.
  return { milestones, tasks: tasks as TaskRow[] };
}

export async function getMilestone(projectId: string, id: string): Promise<MilestoneRow | null> {
  const [row] = await getDb()
    .select({
      id: projectMilestones.id,
      title: projectMilestones.title,
      dueOn: projectMilestones.dueOn,
      completedAt: projectMilestones.completedAt,
    })
    .from(projectMilestones)
    .where(and(eq(projectMilestones.projectId, projectId), eq(projectMilestones.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getTask(projectId: string, id: string): Promise<TaskRow | null> {
  const [row] = await getDb()
    .select({
      id: projectTasks.id,
      milestoneId: projectTasks.milestoneId,
      title: projectTasks.title,
      status: projectTasks.status,
      dueOn: projectTasks.dueOn,
    })
    .from(projectTasks)
    .where(and(eq(projectTasks.projectId, projectId), eq(projectTasks.id, id)))
    .limit(1);
  return (row as TaskRow | undefined) ?? null;
}

/** Milestone choices for the task edit form. */
export async function listMilestoneOptions(projectId: string): Promise<{ id: string; title: string }[]> {
  return getDb()
    .select({ id: projectMilestones.id, title: projectMilestones.title })
    .from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId))
    .orderBy(sql`${projectMilestones.dueOn} asc nulls last`, asc(projectMilestones.createdAt), asc(projectMilestones.id));
}
