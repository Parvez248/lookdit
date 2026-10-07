import "server-only";

import { and, desc, eq, gt, type SQL, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { clientAccounts, clients, clientSessions, projectMilestones, projects, projectTasks } from "@/db/schema";
import type { PortalWorkStatus } from "@/lib/portal/status";
import type { ProjectCategory } from "@/lib/projects/status";

import { portalProjectScope } from "./portal-scope";
import { getWorkspace, type Workspace } from "./project-workspace";

// Client portal reads. Called only from src/lib/portal (the DAL and sign-in) and
// from portal pages after requireClient(). Every project read goes through
// portalProjectScope(clientId), with clientId taken from the verified session.
// Each select names its columns, so internal project fields (slug, publishing
// state, the admin's client link text) never reach the portal.

/** What the portal may know about the signed-in client. Never the password hash. */
export type PortalClient = {
  accountId: string;
  clientId: string;
  name: string;
  clientName: string;
  company: string | null;
};

/** The client behind an unexpired portal session, or null. Expiry uses the DB clock. */
export async function findPortalSession(tokenHash: string): Promise<PortalClient | null> {
  const [row] = await getDb()
    .select({
      accountId: clientAccounts.id,
      clientId: clientAccounts.clientId,
      name: clientAccounts.name,
      clientName: clients.name,
      company: clients.company,
    })
    .from(clientSessions)
    .innerJoin(clientAccounts, eq(clientAccounts.id, clientSessions.accountId))
    .innerJoin(clients, eq(clients.id, clientAccounts.clientId))
    .where(and(eq(clientSessions.tokenHash, tokenHash), gt(clientSessions.expiresAt, sql`now()`)))
    .limit(1);
  return row ?? null;
}

/** Portal sign-in only: the account id and stored hash for a normalized email, or null. */
export async function findClientAccountCredentials(
  email: string,
): Promise<{ id: string; passwordHash: string } | null> {
  const [row] = await getDb()
    .select({ id: clientAccounts.id, passwordHash: clientAccounts.passwordHash })
    .from(clientAccounts)
    .where(eq(clientAccounts.email, email))
    .limit(1);
  return row ?? null;
}

export type PortalProjectSummary = {
  id: string;
  title: string;
  category: ProjectCategory;
  year: number;
  workStatus: PortalWorkStatus;
  updatedAt: Date;
  tasksTotal: number;
  tasksDone: number;
  nextMilestoneTitle: string | null;
  nextMilestoneDueOn: string | null;
};

// The next open milestone, by the same rule as nextMilestone() in
// src/lib/workspace/progress.ts: earliest due date first, undated last.
const nextOpenMilestone = (column: SQL) => sql`(
  select ${column} from ${projectMilestones}
  where ${projectMilestones.projectId} = ${projects.id} and ${projectMilestones.completedAt} is null
  order by ${projectMilestones.dueOn} asc nulls last, ${projectMilestones.createdAt} asc, ${projectMilestones.id} asc
  limit 1
)`;

/**
 * The signed-in client's projects with their progress, in one query: task
 * counts by a grouped join, the next milestone by a correlated subquery
 * (served by the milestones' unique (project_id, id) index). Open work first,
 * then most recently updated.
 */
export async function listPortalProjects(clientId: string): Promise<PortalProjectSummary[]> {
  const rows = await getDb()
    .select({
      id: projects.id,
      title: projects.title,
      category: projects.category,
      year: projects.year,
      workStatus: projects.workStatus,
      updatedAt: projects.updatedAt,
      tasksTotal: sql<number>`count(${projectTasks.id})::int`,
      tasksDone: sql<number>`(count(${projectTasks.id}) filter (where ${projectTasks.status} = 'done'))::int`,
      nextMilestoneTitle: sql<string | null>`${nextOpenMilestone(sql`${projectMilestones.title}`)}`,
      nextMilestoneDueOn: sql<string | null>`${nextOpenMilestone(sql`${projectMilestones.dueOn}::text`)}`,
    })
    .from(projects)
    .leftJoin(projectTasks, eq(projectTasks.projectId, projects.id))
    .where(portalProjectScope(clientId))
    .groupBy(projects.id)
    .orderBy(sql`${projects.workStatus} = 'completed'`, desc(projects.updatedAt), desc(projects.id))
    .limit(100);
  return rows as PortalProjectSummary[];
}

export type PortalProject = {
  id: string;
  title: string;
  category: ProjectCategory;
  year: number;
  summary: string;
  workStatus: PortalWorkStatus;
  updatedAt: Date;
};

/**
 * One project, only if it belongs to this client (and isn't cancelled). Null
 * otherwise: the page answers 404 whether the project is someone else's or
 * doesn't exist, so ids can't be probed.
 */
async function getPortalProject(clientId: string, id: string): Promise<PortalProject | null> {
  const [row] = await getDb()
    .select({
      id: projects.id,
      title: projects.title,
      category: projects.category,
      year: projects.year,
      summary: projects.summary,
      workStatus: projects.workStatus,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(and(eq(projects.id, id), portalProjectScope(clientId)))
    .limit(1);
  return (row as PortalProject | undefined) ?? null;
}

/**
 * A project page's data: the project, then its milestones and tasks. The
 * workspace loads only after the ownership check above passes, so another
 * client's milestones and tasks are never read.
 */
export async function getPortalProjectView(
  clientId: string,
  id: string,
): Promise<{ project: PortalProject; workspace: Workspace } | null> {
  const project = await getPortalProject(clientId, id);
  if (project === null) return null;
  return { project, workspace: await getWorkspace(project.id) };
}
