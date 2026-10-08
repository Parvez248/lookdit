/** Public Vercel Blob stores serve from `<store-id>.public.blob.vercel-storage.com`. */
export const BLOB_PUBLIC_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Resolve a `project_media.storage_key` to a URL the browser can load, or null
 * when it can't be resolved. This is the one storage-specific seam.
 *
 * With Vercel Blob the key is the blob's public URL, exactly as `put()` returned
 * it: the URL is permanent for a public blob, `del()` takes it as is, and the
 * alternative (storing the pathname) would need the store id, which only lives
 * inside the secret token. Anything that isn't an https Blob URL resolves to
 * null, so a bad row renders no image rather than a broken one, and next/image
 * is only ever asked for hosts allowed in next.config.ts.
 */
export function mediaUrl(storageKey: string): string | null {
  let url: URL;
  try {
    url = new URL(storageKey);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(BLOB_PUBLIC_HOST_SUFFIX)) return null;
  // Uploads all live under projects/ (and next.config.ts only allows that path).
  if (!url.pathname.startsWith("/projects/")) return null;
  if (url.search || url.hash || url.port || url.username) return null;
  return url.href;
}
