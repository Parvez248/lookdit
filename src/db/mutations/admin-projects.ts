import "server-only";

import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { slugCandidate, slugify } from "@/lib/projects/slug";
import type { ProjectInput } from "@/lib/projects/validation";

// Admin project writes. Callers check the session and validate with
// parseProjectForm first. Projects made here always start as `draft` (the
// column default), so nothing reaches the public site from the admin yet.

const MAX_SLUG_ATTEMPTS = 50;

/**
 * Insert a project with a slug made from its title. A taken slug gets -2, -3, …
 * `ON CONFLICT (slug) DO NOTHING` makes each try atomic, so two admins adding
 * the same title at once still get different slugs instead of an error.
 */
export async function createProject(input: ProjectInput): Promise<string> {
  const base = slugify(input.title);
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const [row] = await getDb()
      .insert(projects)
      .values({ ...input, slug: slugCandidate(base, attempt) })
      .onConflictDoNothing({ target: projects.slug })
      .returning({ id: projects.id });
    if (row) return row.id;
  }
  throw new Error("No free slug for this project title.");
}

/**
 * Update the admin-editable fields. The slug never changes here: once a project
 * is published it is the public URL. Returns false when no project has this id.
 */
export async function updateProject(id: string, input: ProjectInput): Promise<boolean> {
  const rows = await getDb()
    .update(projects)
    .set({ ...input, updatedAt: sql`now()` })
    .where(eq(projects.id, id))
    .returning({ id: projects.id });
  return rows.length > 0;
}
