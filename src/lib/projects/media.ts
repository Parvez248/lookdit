import { z } from "zod";

import { isUuid } from "../uuid";

// Project media details the admin edits after an image is attached. Pure (no DB,
// no `server-only`). The DB CHECKs (`project_media_role_allowed`) are the backstop.

/**
 * Roles the admin assigns. The table also allows `thumbnail` and `detail`, but
 * the site uses the hero as the /work thumbnail, so only these two are offered.
 */
export const MEDIA_ROLES = ["hero", "gallery"] as const;
export type MediaRole = (typeof MEDIA_ROLES)[number];

export const MEDIA_ROLE_LABELS: Record<MediaRole, string> = {
  hero: "Hero",
  gallery: "Gallery",
};

export const MEDIA_LIMITS = { alt: 300, displayOrderMax: 9999 } as const;

export const isMediaId = isUuid;

// PostgreSQL `text` cannot store U+0000.
const hasNoNul = (value: string) => !value.includes("\u0000");

const mediaDetailsSchema = z.object({
  // Case-study images carry content, so alt text is required, not optional.
  alt: z
    .string({ error: "Describe the image." })
    .trim()
    .min(1, "Describe the image.")
    .max(MEDIA_LIMITS.alt, `Alt text must be at most ${MEDIA_LIMITS.alt} characters.`)
    .refine(hasNoNul, "Alt text contains an invalid character."),
  role: z.enum(MEDIA_ROLES, { error: "Choose hero or gallery." }),
  displayOrder: z
    .string({ error: "Enter an order." })
    .trim()
    .regex(/^\d{1,4}$/, "Enter a whole number.")
    .transform(Number),
});

export type MediaDetails = z.output<typeof mediaDetailsSchema>;

/** Validate the media details form. Only the known fields are read. */
export function parseMediaDetails(formData: FormData): MediaDetails | null {
  const raw = Object.fromEntries(
    (["alt", "role", "displayOrder"] as const).map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : undefined];
    }),
  );
  const parsed = mediaDetailsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

// --- Uploads ------------------------------------------------------------------

/**
 * Largest image the admin can upload. Uploads go through a Server Action, and
 * Vercel caps a function request body at 4.5 MB, so 4 MB leaves room for the
 * multipart overhead (`serverActions.bodySizeLimit` in next.config.ts matches).
 */
export const MEDIA_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export type ImageType = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif"; ext: string };

/** The `accept` list for the file input. The server sniffs the bytes regardless. */
export const MEDIA_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

/**
 * The image type from the file's first bytes, or null when it isn't one we
 * accept. The browser-reported type and the file name are never trusted: this
 * is what decides the stored Content-Type, so an HTML or SVG file renamed to
 * .png is refused rather than served from the Blob store.
 */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  // ISO-BMFF: a leading `ftyp` box whose major brand is avif (still) or avis (sequence).
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 12))) {
    return { mime: "image/avif", ext: "avif" };
  }
  return null;
}

/**
 * An image dimension the browser measured before upload, or null when missing
 * or implausible. Only used to reserve layout space, so null is safe: the image
 * then renders in a fixed frame instead.
 */
export function parseDimension(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,4}$/.test(value)) return null;
  const number = Number(value);
  return number <= 20000 ? number : null;
}

const uploadDetailsSchema = mediaDetailsSchema.pick({ alt: true, role: true });

export type UploadDetails = z.output<typeof uploadDetailsSchema> & { width: number | null; height: number | null };

/** Validate the upload form's text fields (the file is checked separately). */
export function parseUploadDetails(formData: FormData): UploadDetails | null {
  const parsed = uploadDetailsSchema.safeParse({
    alt: typeof formData.get("alt") === "string" ? formData.get("alt") : undefined,
    role: typeof formData.get("role") === "string" ? formData.get("role") : undefined,
  });
  if (!parsed.success) return null;
  const width = parseDimension(formData.get("width"));
  const height = parseDimension(formData.get("height"));
  // Both or neither, so a half-known size never distorts the aspect ratio.
  return width && height ? { ...parsed.data, width, height } : { ...parsed.data, width: null, height: null };
}
