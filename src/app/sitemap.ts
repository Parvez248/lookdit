import type { MetadataRoute } from "next";

import { listPublishedSlugs } from "@/db/queries/projects";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import { siteUrl } from "@/lib/site-url";

// Published case studies come from the database at request time, like /work,
// so the build never needs DATABASE_URL.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, siteUrl()).href;
  const pages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/work"), changeFrequency: "weekly", priority: 0.8 },
  ];

  try {
    const projects = await listPublishedSlugs();
    return [
      ...pages,
      ...projects.map((project) => ({
        url: url(`/work/${project.slug}`),
        lastModified: project.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    // A database hiccup shouldn't take the whole sitemap down; the static pages still list.
    console.error("[sitemap] case studies unavailable", { event: "error", ...describeErrorForLog(error) });
    return pages;
  }
}
