import type { WorkEntry } from "@/components/work/FeatureTile";
import type { ConceptProject } from "@/content/work";
import type { PublishedProjectListItem } from "@/db/queries/projects";

/**
 * Client work first, in the order given (the query already puts featured
 * first), then concepts to fill the remaining slots.
 */
export function pickFeatured(
  projects: readonly PublishedProjectListItem[],
  concepts: readonly ConceptProject[],
  limit: number,
): WorkEntry[] {
  const client: WorkEntry[] = projects.slice(0, limit).map((project) => ({ kind: "client", project }));
  const fill: WorkEntry[] = concepts
    .slice(0, Math.max(0, limit - client.length))
    .map((concept) => ({ kind: "concept", concept }));
  return [...client, ...fill];
}
