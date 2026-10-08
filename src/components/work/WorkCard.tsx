import Image from "next/image";
import Link from "next/link";

import type { PublishedProjectListItem } from "@/db/queries/projects";
import { mediaUrl } from "@/lib/media/url";
import { PROJECT_CATEGORY_LABELS, type ProjectCategory } from "@/lib/projects/status";

import styles from "./WorkCard.module.css";

/**
 * One project in the public /work listing. The whole plate is a single link.
 * With a hero image, the image sits beside the text on wide screens and above
 * it on narrow ones. The image is decorative here (alt=""): the link's text
 * already names the project, and the case study carries the described image.
 */
export function WorkCard({ project }: { project: PublishedProjectListItem }) {
  const category = PROJECT_CATEGORY_LABELS[project.category as ProjectCategory] ?? project.category;
  const cover = project.cover ? mediaUrl(project.cover.storageKey) : null;

  return (
    <li className={styles.item}>
      <Link href={`/work/${project.slug}`} className={styles.link} data-cover={cover ? "" : undefined}>
        {cover ? (
          <span className={styles.cover}>
            <Image src={cover} alt="" fill sizes="(min-width: 56rem) 50vw, 100vw" className={styles.coverImage} />
          </span>
        ) : null}
        <div className={styles.body}>
        <span className={styles.meta}>
          <span className={styles.category}>{category}</span>
          <span className={styles.year}>{project.year}</span>
        </span>

        <h2 className={styles.title}>{project.title}</h2>
        <p className={styles.summary}>{project.summary}</p>

        {project.technologies.length > 0 ? (
          <span className={styles.tech}>
            {project.technologies.map((tech) => (
              <span key={tech.id} className={styles.techItem}>
                {tech.name}
              </span>
            ))}
          </span>
        ) : null}

        <span className={styles.cue} aria-hidden="true">
          View case study
          <svg viewBox="0 0 16 16" focusable="false" className={styles.cueIcon}>
            <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        </div>
      </Link>
    </li>
  );
}
