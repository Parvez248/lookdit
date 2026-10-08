import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { projectMedia } from "@/db/schema";
import type { ImageType, MediaDetails, UploadDetails } from "@/lib/projects/media";

// Admin writes to project media metadata. Callers check the session and
// validate first. Every write matches on project id AND media id, so a crafted
// form can't touch another project's media.

/**
 * Demote the project's current hero to gallery. Only ever sent in the same
 * `db.batch` (one transaction) as the write that sets the new hero, so a failed
 * write rolls the demotion back and the old hero stays. With `newHeroId`, it
 * skips that row and does nothing unless the row exists in this project, so a
 * stale or crafted media id can't strip the hero without setting a new one.
 */
function demoteHero(projectId: string, newHeroId?: string) {
  return getDb()
    .update(projectMedia)
    .set({ role: "gallery", updatedAt: sql`now()` })
    .where(
      and(
        eq(projectMedia.projectId, projectId),
        eq(projectMedia.role, "hero"),
        newHeroId ? ne(projectMedia.id, newHeroId) : undefined,
        newHeroId
          ? sql`exists (select 1 from ${projectMedia} where ${projectMedia.projectId} = ${projectId} and ${projectMedia.id} = ${newHeroId})`
          : undefined,
      ),
    );
}

/**
 * Attach an uploaded image to a project, after every existing item (order is
 * the current maximum + 10, so the admin can slot items in between). A new hero
 * replaces the old one, which becomes a gallery image. Throws on a FK violation
 * when the project was deleted meanwhile; the caller then removes the file.
 */
export async function insertProjectImage(
  projectId: string,
  storageKey: string,
  type: ImageType,
  fileSize: number,
  details: UploadDetails,
): Promise<void> {
  const db = getDb();
  const insert = db
    .insert(projectMedia)
    .values({
      projectId,
      kind: "image",
      role: details.role,
      storageKey,
      alt: details.alt,
      width: details.width,
      height: details.height,
      mimeType: type.mime,
      fileSize,
      displayOrder: sql`coalesce((select max(${projectMedia.displayOrder}) from ${projectMedia} where ${projectMedia.projectId} = ${projectId}), 0) + 10`,
    });
  if (details.role === "hero") await db.batch([demoteHero(projectId), insert]);
  else await insert;
}

/**
 * Save alt text, role and order. Making an image the hero demotes the
 * project's current hero to gallery in the same transaction, because
 * `project_media_one_hero_per_project_idx` allows one hero per project.
 * Returns false when no such media row exists.
 */
export async function updateProjectMediaDetails(
  projectId: string,
  mediaId: string,
  details: MediaDetails,
): Promise<boolean> {
  const db = getDb();
  const update = db
    .update(projectMedia)
    .set({ ...details, updatedAt: sql`now()` })
    .where(and(eq(projectMedia.projectId, projectId), eq(projectMedia.id, mediaId)))
    .returning({ id: projectMedia.id });
  if (details.role !== "hero") return (await update).length > 0;
  const [, rows] = await db.batch([demoteHero(projectId, mediaId), update]);
  return rows.length > 0;
}

/**
 * Delete a media row and return its storage key, so the caller can remove the
 * stored file too. Null when no such row exists.
 */
export async function deleteProjectMedia(projectId: string, mediaId: string): Promise<string | null> {
  const [row] = await getDb()
    .delete(projectMedia)
    .where(and(eq(projectMedia.projectId, projectId), eq(projectMedia.id, mediaId)))
    .returning({ storageKey: projectMedia.storageKey });
  return row?.storageKey ?? null;
}
