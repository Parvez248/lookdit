import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { projectMedia } from "@/db/schema";
import type { ImageType, MediaDetails, UploadDetails } from "@/lib/projects/media";

// Admin writes to project media metadata. Callers check the session and
// validate first. Every write matches on project id AND media id, so a crafted
// form can't touch another project's media.

/** Demote the project's current hero (other than `exceptId`) to gallery. */
async function demoteHero(projectId: string, exceptId?: string): Promise<void> {
  await getDb()
    .update(projectMedia)
    .set({ role: "gallery", updatedAt: sql`now()` })
    .where(
      and(
        eq(projectMedia.projectId, projectId),
        eq(projectMedia.role, "hero"),
        exceptId ? ne(projectMedia.id, exceptId) : undefined,
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
  if (details.role === "hero") await demoteHero(projectId);
  await getDb()
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
}

/**
 * Save alt text, role and order. Making an image the hero first demotes the
 * project's current hero to gallery, because `project_media_one_hero_per_project_idx`
 * allows one hero per project. Returns false when no such media row exists.
 */
export async function updateProjectMediaDetails(
  projectId: string,
  mediaId: string,
  details: MediaDetails,
): Promise<boolean> {
  if (details.role === "hero") await demoteHero(projectId, mediaId);
  const rows = await getDb()
    .update(projectMedia)
    .set({ ...details, updatedAt: sql`now()` })
    .where(and(eq(projectMedia.projectId, projectId), eq(projectMedia.id, mediaId)))
    .returning({ id: projectMedia.id });
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
