import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { projectMedia, projectTechnologies, projects, technologies } from "@/db/schema";

/** Minimal technology reference shown alongside a project. */
export type ProjectTechnologyRef = {
  id: number;
  slug: string;
  name: string;
  category: string;
};

/** A single item in the public published-project listing. */
export type PublishedProjectListItem = {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  category: string;
  year: number;
  summary: string;
  featured: boolean;
  technologies: ProjectTechnologyRef[];
};

/** Ordered media metadata for a project detail — object-storage key only, no URL/binary. */
export type ProjectMediaItem = {
  id: string;
  kind: string;
  role: string;
  storageKey: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  displayOrder: number;
};

/** Full public project detail. */
export type PublishedProjectDetail = {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  category: string;
  year: number;
  summary: string;
  featured: boolean;
  displayOrder: number;
  liveUrl: string | null;
  metrics: Array<{ label: string; value: string }> | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  technologies: ProjectTechnologyRef[];
  media: ProjectMediaItem[];
};

/**
 * Batch-load technologies for many projects in ONE query, grouped by project id.
 * This is what keeps the listing free of N+1 queries. Ordered by the
 * technology's own display order for stable presentation.
 */
async function technologiesByProjectIds(
  projectIds: readonly string[],
): Promise<Map<string, ProjectTechnologyRef[]>> {
  const grouped = new Map<string, ProjectTechnologyRef[]>();
  if (projectIds.length === 0) return grouped;

  const rows = await db
    .select({
      projectId: projectTechnologies.projectId,
      id: technologies.id,
      slug: technologies.slug,
      name: technologies.name,
      category: technologies.category,
    })
    .from(projectTechnologies)
    .innerJoin(
      technologies,
      eq(technologies.id, projectTechnologies.technologyId),
    )
    .where(inArray(projectTechnologies.projectId, [...projectIds]))
    .orderBy(asc(technologies.displayOrder), asc(technologies.id));

  for (const row of rows) {
    const list = grouped.get(row.projectId);
    const ref: ProjectTechnologyRef = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
    };
    if (list) {
      list.push(ref);
    } else {
      grouped.set(row.projectId, [ref]);
    }
  }
  return grouped;
}

/**
 * Public portfolio listing: published projects only, ordered
 * featured DESC, display_order ASC, year DESC (with a deterministic id tiebreak).
 * Two queries total (projects, then their technologies) — no N+1.
 */
export async function listPublishedProjects(): Promise<PublishedProjectListItem[]> {
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      client: projects.client,
      category: projects.category,
      year: projects.year,
      summary: projects.summary,
      featured: projects.featured,
    })
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(
      desc(projects.featured),
      asc(projects.displayOrder),
      desc(projects.year),
      asc(projects.id),
    );

  if (rows.length === 0) return [];

  const techByProject = await technologiesByProjectIds(rows.map((r) => r.id));

  return rows.map((r) => ({
    ...r,
    technologies: techByProject.get(r.id) ?? [],
  }));
}

/**
 * Public project detail by canonical slug. Returns null when no PUBLISHED project
 * matches the slug (draft/archived are never exposed here). Technologies and
 * ordered media are loaded in two additional constant queries — no N+1.
 */
export async function getPublishedProjectBySlug(
  slug: string,
): Promise<PublishedProjectDetail | null> {
  const [project] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      client: projects.client,
      category: projects.category,
      year: projects.year,
      summary: projects.summary,
      featured: projects.featured,
      displayOrder: projects.displayOrder,
      liveUrl: projects.liveUrl,
      metrics: projects.metrics,
      seoTitle: projects.seoTitle,
      seoDescription: projects.seoDescription,
      publishedAt: projects.publishedAt,
    })
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
    .limit(1);

  if (!project) return null;

  const [techs, media] = await Promise.all([
    getProjectTechnologies(project.id),
    db
      .select({
        id: projectMedia.id,
        kind: projectMedia.kind,
        role: projectMedia.role,
        storageKey: projectMedia.storageKey,
        alt: projectMedia.alt,
        width: projectMedia.width,
        height: projectMedia.height,
        mimeType: projectMedia.mimeType,
        displayOrder: projectMedia.displayOrder,
      })
      .from(projectMedia)
      .where(eq(projectMedia.projectId, project.id))
      .orderBy(asc(projectMedia.displayOrder), asc(projectMedia.id)),
  ]);

  return {
    ...project,
    technologies: techs,
    media,
  };
}

/**
 * Internal helper: the technologies for a single project, ordered by the
 * technology's display order. Wraps the batch loader; used by the detail query.
 */
async function getProjectTechnologies(
  projectId: string,
): Promise<ProjectTechnologyRef[]> {
  const grouped = await technologiesByProjectIds([projectId]);
  return grouped.get(projectId) ?? [];
}
