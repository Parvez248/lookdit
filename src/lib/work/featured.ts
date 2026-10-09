import "server-only";

import type { WorkEntry } from "@/components/work/FeatureTile";
import { selectedWork } from "@/content/work";
import { listPublishedProjects, type PublishedProjectListItem } from "@/db/queries/projects";
import { describeErrorForLog } from "@/lib/inquiries/submission";

import { pickFeatured } from "./pick";

/**
 * The homepage's Selected Work: published client projects first (featured,
 * then display order, as `listPublishedProjects` sorts them), topped up with
 * LOOKDIT concepts so the section is never empty. If the database can't be
 * read (or isn't configured, as in CI builds), the concepts alone are shown.
 */
export async function featuredWork(limit = 3): Promise<WorkEntry[]> {
  let projects: PublishedProjectListItem[] = [];
  try {
    projects = await listPublishedProjects();
  } catch (error) {
    console.warn("[selected-work] published projects unavailable; showing concepts", {
      event: "warn",
      ...describeErrorForLog(error),
    });
  }
  return pickFeatured(projects, selectedWork.items, limit);
}
