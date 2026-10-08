"use server";

// Admin-only project media actions: upload to Vercel Blob, edit details,
// remove. Every export of a "use server" file is a POST-reachable endpoint, so
// each one checks the session itself first, and every write is scoped to the
// project id in the form (see the mutations).

import { del, put } from "@vercel/blob";
import { refresh } from "next/cache";

import { deleteProjectMedia, insertProjectImage, updateProjectMediaDetails } from "@/db/mutations/project-media";
import { requireUser } from "@/lib/auth/session";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import {
  isMediaId,
  MEDIA_UPLOAD_MAX_BYTES,
  parseMediaDetails,
  parseUploadDetails,
  sniffImageType,
} from "@/lib/projects/media";
import { isProjectId } from "@/lib/projects/status";

export type MediaFormState = { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

const FOREIGN_KEY_VIOLATION = "23503";
const UNIQUE_VIOLATION = "23505";

/** Blob credentials: a read-write token, or the OIDC store id Vercel sets when a store is connected. */
function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/** Remove a stored file, logging rather than throwing: the DB row is what the site reads. */
async function deleteBlob(url: string, label: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error(`[admin] ${label}: blob delete failed`, { event: "error", ...describeErrorForLog(error) });
  }
}

export async function uploadProjectImage(_previous: MediaFormState, formData: FormData): Promise<MediaFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) return { status: "error", message: "Try again." };
  const projectId = formData.get("projectId");
  if (!isProjectId(projectId)) return { status: "error", message: "Try again." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose an image to upload." };
  if (file.size > MEDIA_UPLOAD_MAX_BYTES) return { status: "error", message: "That image is over 4 MB. Export it smaller." };
  const type = sniffImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!type) return { status: "error", message: "Use a JPEG, PNG, WebP or AVIF image." };

  const details = parseUploadDetails(formData);
  if (!details) return { status: "error", message: "Describe the image in the alt text (up to 300 characters)." };

  if (!blobConfigured()) {
    return { status: "error", message: "Image storage isn't connected yet. Connect a Blob store in Vercel first." };
  }

  // Random suffix: names are unguessable and never collide, so a re-upload
  // never overwrites a file a page may still be showing.
  let url: string;
  try {
    const blob = await put(`projects/${projectId}/image.${type.ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: type.mime,
    });
    url = blob.url;
  } catch (error) {
    console.error("[admin] media upload failed", { event: "error", ...describeErrorForLog(error) });
    return { status: "error", message: "The image couldn't be uploaded. Try again." };
  }

  try {
    await insertProjectImage(projectId, url, type, file.size, details);
  } catch (error) {
    await deleteBlob(url, "media upload rollback");
    const { code } = describeErrorForLog(error);
    if (code === FOREIGN_KEY_VIOLATION) return { status: "error", message: "This project no longer exists." };
    // Two hero uploads at once: the one-hero index rejects the second.
    if (code === UNIQUE_VIOLATION) return { status: "error", message: "Another image just became the hero. Try again." };
    console.error("[admin] media insert failed", { event: "error", ...describeErrorForLog(error) });
    return { status: "error", message: "The image couldn't be saved. Try again." };
  }
  refresh();
  return { status: "saved" };
}

export async function saveMediaDetails(_previous: MediaFormState, formData: FormData): Promise<MediaFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) return { status: "error", message: "Try again." };
  const projectId = formData.get("projectId");
  const mediaId = formData.get("mediaId");
  if (!isProjectId(projectId) || !isMediaId(mediaId)) return { status: "error", message: "Try again." };

  const details = parseMediaDetails(formData);
  if (!details) {
    return { status: "error", message: "Check the alt text (required, up to 300 characters) and order (0–9999)." };
  }

  try {
    const found = await updateProjectMediaDetails(projectId, mediaId, details);
    if (!found) return { status: "error", message: "This image no longer exists." };
  } catch (error) {
    if (describeErrorForLog(error).code === UNIQUE_VIOLATION) {
      return { status: "error", message: "Another image just became the hero. Try again." };
    }
    console.error("[admin] media save failed", { event: "error", ...describeErrorForLog(error) });
    return { status: "error", message: "That couldn't be saved. Try again." };
  }
  refresh();
  return { status: "saved" };
}

export async function removeProjectMedia(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;
  const projectId = formData.get("projectId");
  const mediaId = formData.get("mediaId");
  if (!isProjectId(projectId) || !isMediaId(mediaId)) return;

  let storageKey: string | null;
  try {
    storageKey = await deleteProjectMedia(projectId, mediaId);
  } catch (error) {
    console.error("[admin] media delete failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The image couldn't be removed. Try again.");
  }
  // Row first, file second: if the file delete fails, the site has already
  // stopped showing it and only an orphaned file is left behind.
  if (storageKey) await deleteBlob(storageKey, "media remove");
  refresh();
}
