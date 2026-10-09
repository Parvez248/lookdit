import Image from "next/image";
import Link from "next/link";

import { Specimen } from "@/components/specimens/Specimen";
import type { ConceptProject } from "@/content/work";
import type { PublishedProjectListItem } from "@/db/queries/projects";
import { mediaUrl } from "@/lib/media/url";
import { PROJECT_CATEGORY_LABELS, type ProjectCategory } from "@/lib/projects/status";

import { ConceptBadge } from "./ConceptBadge";
import styles from "./FeatureTile.module.css";

/** A Selected Work entry: published client work from the database, or a static concept. */
export type WorkEntry =
  | { kind: "client"; project: PublishedProjectListItem }
  | { kind: "concept"; concept: ConceptProject };

type FeatureTileProps = {
  entry: WorkEntry;
  /** `lead`: the large first tile, cover beside text on wide screens. */
  size?: "lead" | "standard";
  headingLevel?: "h2" | "h3";
};

/**
 * One project as a linked tile: cover, then classification, title, summary.
 * A published project shows its uploaded hero image and its category and
 * year under a neutral "Case study" label (publishing doesn't verify that it
 * is client work); a concept shows its concept drawing and always carries
 * the concept badge, so the two can never be confused. The whole tile is one link.
 */
export function FeatureTile({ entry, size = "standard", headingLevel: Heading = "h3" }: FeatureTileProps) {
  const isConcept = entry.kind === "concept";
  const href = isConcept ? `/work/concepts/${entry.concept.slug}` : `/work/${entry.project.slug}`;
  const title = isConcept ? entry.concept.title : entry.project.title;
  const summary = isConcept ? entry.concept.description : entry.project.summary;
  const cover = !isConcept && entry.project.cover ? mediaUrl(entry.project.cover.storageKey) : null;

  return (
    <article className={`${styles.tile} ${size === "lead" ? styles.lead : ""}`}>
      <div className={styles.cover}>
        {isConcept ? (
          <Specimen kind={entry.concept.visual} />
        ) : cover ? (
          <span className={styles.image}>
            <Image
              src={cover}
              alt=""
              fill
              sizes={size === "lead" ? "(min-width: 64rem) 55vw, 100vw" : "(min-width: 48rem) 45vw, 100vw"}
              className={styles.imageEl}
            />
          </span>
        ) : (
          <span className={styles.empty} aria-hidden="true">
            {PROJECT_CATEGORY_LABELS[entry.project.category as ProjectCategory] ?? entry.project.category}
          </span>
        )}
      </div>

      <div className={styles.body}>
        {isConcept ? (
          <>
            <ConceptBadge />
            <p className={styles.meta}>{entry.concept.classification}</p>
          </>
        ) : (
          <p className={styles.meta}>
            <span className={styles.kind}>Case study</span>
            <span>{PROJECT_CATEGORY_LABELS[entry.project.category as ProjectCategory] ?? entry.project.category}</span>
            <span>{entry.project.year}</span>
          </p>
        )}
        <Heading className={styles.title}>
          <Link href={href} className={styles.link}>
            {title}
          </Link>
        </Heading>
        <p className={styles.summary}>{summary}</p>
        <span className={styles.cue} aria-hidden="true">
          {isConcept ? "View concept" : "View case study"}
          <svg viewBox="0 0 16 16" focusable="false" className={styles.cueIcon}>
            <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </div>
    </article>
  );
}
