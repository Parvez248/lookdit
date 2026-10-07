// Project slugs. Pure. Must satisfy the `projects_slug_format` CHECK:
// lowercase a-z / 0-9 words joined by single hyphens.

export const SLUG_MAX_LENGTH = 80;

/**
 * A slug from a project title: accents folded ("Café" → "cafe"), anything
 * else that isn't a-z or 0-9 becomes a hyphen. Cut at a word boundary to
 * keep it short. A title with no usable characters gives "project".
 */
export function slugify(title: string): string {
  const words = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  let slug = "";
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word;
    if (next.length > SLUG_MAX_LENGTH) break;
    slug = next;
  }
  // A single word longer than the limit: cut it.
  if (!slug && words[0]) slug = words[0].slice(0, SLUG_MAX_LENGTH);
  return slug || "project";
}

/** The nth candidate for a taken slug: "site", "site-2", "site-3", … */
export function slugCandidate(base: string, attempt: number): string {
  return attempt <= 1 ? base : `${base}-${attempt}`;
}
