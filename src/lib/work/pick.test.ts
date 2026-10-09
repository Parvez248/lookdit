import { describe, expect, it } from "vitest";

import { selectedWork } from "../../content/work";
import type { PublishedProjectListItem } from "@/db/queries/projects";

import { pickFeatured } from "./pick";

const project = (id: string): PublishedProjectListItem => ({
  id,
  slug: id,
  title: id,
  client: null,
  category: "website",
  year: 2026,
  summary: "",
  featured: false,
  technologies: [],
  cover: null,
});
const concepts = selectedWork.items;
const ids = (entries: ReturnType<typeof pickFeatured>) =>
  entries.map((e) => (e.kind === "client" ? e.project.id : e.concept.slug));

describe("pickFeatured", () => {
  it("shows only concepts when nothing is published", () => {
    expect(pickFeatured([], concepts, 3).map((e) => e.kind)).toEqual(["concept", "concept", "concept"]);
  });

  it("puts client work first and tops up with concepts", () => {
    expect(ids(pickFeatured([project("p1")], concepts, 3))).toEqual(["p1", concepts[0].slug, concepts[1].slug]);
  });

  it("drops concepts once client work fills the section", () => {
    const entries = pickFeatured([project("p1"), project("p2"), project("p3"), project("p4")], concepts, 3);
    expect(ids(entries)).toEqual(["p1", "p2", "p3"]);
  });
});
