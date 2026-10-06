// Selected Work content (static, curated).
// Rule: Selected Work may contain real client work and clearly identified LOOKDIT concept work.
// Concept work must never be presented in a way that implies a real client, commercial
// engagement, or measured result. Concept projects therefore live here, never in the
// `projects` table, and their type has no client, year, metrics or live-URL fields at all.

import type { services } from "./site";

type ServiceName = (typeof services.items)[number]["name"];

/** A stage position on the journey: 1-based, inclusive. */
type StagePosition = 1 | 2 | 3 | 4 | 5;

/**
 * A temporary experience/capability map: where each core service is emphasised across a
 * customer journey. It describes the concept's design intent, not measured data, and is
 * replaced by the concept's real screens once they exist.
 */
export type CapabilityMap = {
  /** Frames the spans as emphasis in this concept, not strict service boundaries. */
  label: string;
  caption: string;
  stages: readonly [string, string, string, string, string];
  spans: readonly { capability: ServiceName; from: StagePosition; to: StagePosition }[];
};

export type ConceptProject = {
  kind: "concept";
  slug: string;
  title: string;
  classification: string;
  description: string;
  map: CapabilityMap;
};

/** Real client work joins this union when it exists (sourced from the database). */
export type WorkItem = ConceptProject;

/** Shown with every concept project. Rendered from `kind`, so it can't be left out. */
export const conceptDisclosure = "A LOOKDIT concept project — not client work.";

export const selectedWork = {
  label: "Selected work",
  items: [
    {
      kind: "concept",
      slug: "ecommerce-experience",
      title: "E-commerce Experience",
      classification: "Concept Project · E-commerce",
      description: "A commerce experience designed around discovery, conversion and operations.",
      map: {
        label: "Capability emphasis across the concept",
        caption:
          "Concept scope: where each core service is emphasised across the customer journey.",
        stages: ["Discovery", "Shopping", "Conversion", "Customer experience", "Business operations"],
        spans: [
          { capability: "SEO", from: 1, to: 2 },
          { capability: "Digital Marketing", from: 1, to: 3 },
          { capability: "Web Apps Development", from: 2, to: 5 },
        ],
      },
    },
  ],
} as const satisfies { label: string; items: readonly WorkItem[] };
