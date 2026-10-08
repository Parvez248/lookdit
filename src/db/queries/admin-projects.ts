import "server-only";

import { asc, count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { clients, projects } from "@/db/schema";
import {
  PROJECTS_PAGE_SIZE,
  type ProjectCategory,
  type PublicStatus,
  type WorkStatus,
} from "@/lib/projects/status";

// Admin reads of project data. Call only after requireUser(). Kept apart from
// the public reads in ./projects so internal fields (work status, client link)
// never end up in a public query by accident.

export type ProjectSummary = {
  id: string;
  title: string;
  category: ProjectCategory;
  workStatus: WorkStatus;
  publicStatus: PublicStatus;
  clientName: string | null;
  updatedAt: Date;
};

export type ProjectDetail = ProjectSummary & {
  slug: string;
  clientId: string | null;
  year: number;
  summary: string;
  createdAt: Date;
  // Public case-study fields (shown on /work once published).
  publicClient: string | null;
  liveUrl: string | null;
  featured: boolean;
  metrics: Array<{ label: string; value: string }> | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const summaryColumns = {
  id: projects.id,
  title: projects.title,
  category: projects.category,
  workStatus: projects.workStatus,
  publicStatus: projects.status,
  clientName: clients.name,
  updatedAt: projects.updatedAt,
};

/**
 * One page of projects, most recently updated first (`id` breaks ties),
 * optionally filtered by work status. The table is small, so this sorts
 * rather than using an index until a real volume says otherwise.
 */
export async function listProjects(status: WorkStatus | null, page: number): Promise<ProjectSummary[]> {
  const rows = await getDb()
    .select(summaryColumns)
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(status ? eq(projects.workStatus, status) : undefined)
    .orderBy(desc(projects.updatedAt), desc(projects.id))
    .limit(PROJECTS_PAGE_SIZE)
    .offset((page - 1) * PROJECTS_PAGE_SIZE);
  // The CHECK constraints guarantee the status and category vocabularies.
  return rows as ProjectSummary[];
}

export async function countProjectsByWorkStatus(): Promise<Record<WorkStatus, number>> {
  const rows = await getDb()
    .select({ status: projects.workStatus, total: count() })
    .from(projects)
    .groupBy(projects.workStatus);
  const counts: Record<WorkStatus, number> = { planned: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 };
  for (const row of rows) counts[row.status as WorkStatus] = row.total;
  return counts;
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const [row] = await getDb()
    .select({
      ...summaryColumns,
      slug: projects.slug,
      clientId: projects.clientId,
      year: projects.year,
      summary: projects.summary,
      createdAt: projects.createdAt,
      publicClient: projects.client,
      liveUrl: projects.liveUrl,
      featured: projects.featured,
      metrics: projects.metrics,
      seoTitle: projects.seoTitle,
      seoDescription: projects.seoDescription,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, id))
    .limit(1);
  return (row as ProjectDetail | undefined) ?? null;
}

/** A client's projects for the client page, newest activity first (`projects_client_id_idx`). */
export async function listClientProjects(
  clientId: string,
): Promise<{ id: string; title: string; workStatus: WorkStatus; year: number }[]> {
  const rows = await getDb()
    .select({ id: projects.id, title: projects.title, workStatus: projects.workStatus, year: projects.year })
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .orderBy(desc(projects.updatedAt), desc(projects.id))
    .limit(50);
  return rows as { id: string; title: string; workStatus: WorkStatus; year: number }[];
}

export type ClientOption = { id: string; name: string; company: string | null };

/** Every client, A to Z, for the project form's client picker. */
export async function listClientOptions(): Promise<ClientOption[]> {
  return getDb()
    .select({ id: clients.id, name: clients.name, company: clients.company })
    .from(clients)
    .orderBy(asc(sql`lower(${clients.name})`), asc(clients.id))
    .limit(1000);
}
